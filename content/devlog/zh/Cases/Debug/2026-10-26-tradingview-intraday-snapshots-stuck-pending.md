---
type: case-debug
date: 2026-10-26
tags: [debug, backend, infra, auth, python, tradingview]
status: open
---
# TradingView 日内快照卡在 SNAPSHOT_PENDING

KairoTrade 上所有 TradingView 日内序列（5m、1h）都卡在了 `SNAPSHOT_PENDING`，日线却一直正常。`SNAPSHOT_PENDING` 是序列还没拿到可用快照时的状态。

==`TV_TOKEN` 是有效期约 4 小时的 [[zh/Glossary/JWT|JWT]]，一直没有任何逻辑去续期。== JWT 是带签名的 token，自带过期时间字段 `exp`。过了这个点，行情源（feed）就拉不到日内数据了。

修复在 [[zh/Glossary/PR|PR]] #109：feed 的 sidecar 在 token 到期前 10 分钟，从 TradingView 登录会话里换新 token。sidecar 是挨着主服务跑的独立小服务，这里指 feed VM 上替 API 跟 TradingView 通信的 Python 服务。

案例还没结。10/29 sidecar 的 `/history` 调用又开始失败，第二次故障的原因还没查清。

token 最初怎么拿到见 [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]，它已经不是浏览器 cookie 了。这篇接着往下讲：拿到手之后，它会过期。

## 现象

| 日期 | 现象 | 未受影响 |
| --- | --- | --- |
| 10/25 | `MNQ1!`（CME_MINI）：所有周期都是 `SNAPSHOT_PENDING` | Yahoo `MNQ=F` 正常 |
| 10/26 | NVDA、`MNQ1!`、`MES1!`，5m 和 1h：全为 `SNAPSHOT_PENDING` | 日线正常 |

10/26 的影响面覆盖 TradingView 路径上的全部日内序列，股票和期货都在里面。

## 复现

源材料没记刻意复现，规律从 token 有效期就能推出来：设完 token 约 4 小时后，所有日内序列同一时刻停更，一直停到有人换新 token。

## 排查经过

源材料记了每次会话看到的现象和结论，没记中间敲的命令。

1. **10/25，只看到一个期货根代码。** 只有 `MNQ1!` pending。Yahoo 的 `MNQ=F` 正常，说明行情数据本身没断，出问题的是 TradingView 路径。当晚猜测 TradingView 订阅过期，下一步计划查：

   ```bash
   journalctl -u tvfeed
   ```

   那次会话没跑这条命令。

2. **10/26 下午，范围扩大。** NVDA 和 `MES1!` 在 5m 和 1h 上也都成了 pending，日线依旧正常。股票和期货、所有日内周期一起失效，指向整条日内路径共用的环节。

   在 agent 会话里读 feed VM 日志报错：

   ```
   Permission denied (publickey)
   ```

   留给负责人的备注是改从普通终端跑 `journalctl -u tvfeed`。

3. **10/26 晚上，查清原因。** 会话确认 `TV_TOKEN` 是有效期约 4 小时的 JWT，一过期所有日内序列就掉成 `SNAPSHOT_PENDING`。源材料没写具体是哪条日志还是解出的哪个 `exp` claim 坐实了这一点。

10/25 猜的是订阅问题，根子其实在 token 有效期。

## 根因

==sidecar 用固定 `TV_TOKEN` 认证，这个 JWT 约 4 小时过期，sidecar 没有任何续期步骤。== 日线不靠这个 token（10/25 Yahoo 的 `MNQ=F` 正常），所以所有日内序列停了，日线还能照常出数据。

![TV_TOKEN 有效期约四小时，提前十分钟刷新可避免日内请求进入 SNAPSHOT_PENDING。](../../Diagrams/2026-10-26-tradingview-intraday-snapshots-stuck-pending.refresh-timeline.svg)

## 修复

| 项目 | 值 |
| --- | --- |
| PR | #109（claude2），合并为 `162ea9a` |
| 改动 | sidecar 用 `TV_SESSIONID` + `TV_SESSIONID_SIGN` 请求 TradingView 的 `/chart/` 页面，从中取新 token |
| 刷新 | 后台定时运行，提前到当前 token 到期前 10 分钟 |
| 测试 | 129 个 Python 单元测试通过 |
| 部署 | `rsync` 到 feed VM |

`TV_SESSIONID` 和 `TV_SESSIONID_SIGN` 存着 TradingView 登录会话，和七月案例在浏览器里找到的 `sessionid` / `sessionid_sign` cookie 对应。现在 token 直接从会话派生，不用再手工填。

部署时跳过了 `pip`：feed VM 跑 Python 3.10，而 `requirements.txt` 钉了 `pandas==3.0.6`，要求 3.11。下次加依赖前得先解掉这个冲突。

部署后检查：

```
/token          source: sessionid, valid, expires 2026-10-27T06:48Z
MES1! 5m        asOf 2026-10-27T02:20Z
NVDA 5m         asOf 2026-10-26T19:55Z
```

sidecar 的 `/token` 接口直接报当前 token 的来源和到期时间，核对时不用登 VM 的 shell。

## 10/29 第二次故障

三天后，新的 K 线存储一直空着，顺藤摸瓜又回到 sidecar。K 线就是 OHLC bar（开盘、最高、最低、收盘），K 线存储把这些 bar 存在 Redis 里。

| 时间（UTC） | 观察 |
| --- | --- |
| 01:06:53 | 旧行情路径最后一次成功调 sidecar |
| 10:55 | 部署 `524bbd7` |
| 11:00-11:28 | `MES1!` 5m 仍停在 01:06 那份 300 根 bar 快照；`ohlcv-series` 的 `updatedAt` 为空 |
| 12:00:55 | NVDA 1d 回退到 Yahoo，说明 sidecar 的 `/history` 失败了 |
| 12:40 | 部署 `a8c0808`（#153）；`ohlcv-series` 仍为空 |

源材料确认的三件事：

- sidecar 的 `/history` 向 API 返回失败。
- 现有数据看不出失败是不是在 10:55 部署前就开始了。
- 可能的诱因：部署冷启动会发出约 32 个请求，每个拉 600-1000 根 bar。

#153 没修 sidecar，缩短的是 sidecar 恢复后的空窗期：

| #153 的改动 | 值 |
| --- | --- |
| K 线存储的静默返回 | 改为记录 `reason` |
| 空结果 | 取消 1 小时 negative cache |
| 拉取失败 | 5 分钟内重试 |
| sidecar 请求超时 | 12 s → 20 s |

negative cache（负缓存）把「没有数据」这个结果也缓起来，免得下一个调用方再问。负缓存设一小时，sidecar 恢复后空答案最多还会保留一小时。

还没跑的检查：从 01:00 起翻 feed VM 日志，查 token 和 history 相关报错：

```bash
ssh <feed-vm> "sudo journalctl -u tvfeed --since '2026-10-29 01:00' | grep -E 'No data returned|ERROR|Traceback|token|n_bars' | tail -80"
```

源材料还要求确认 TradingView 的 session id 本身过没过期。#109 每次刷新的 token 都从这个 session id 派生，session 一过期刷新也跟着停。这点还没人答复；另外八个期货根代码（ES、NQ、RTY、M2K、YM、MYM、CL、GC）要等 sidecar 恢复后再验。

## 经验与小技巧

- 某条路径上所有序列同时失败、另一条路径还能正常提供同样的标的，先查失败路径共用的部分（比如凭据），别急着看单个标的或交易所。
- 带 `exp` 的 token 必须有人在到期前续期：保留寿命更长的凭据（这里是登录会话），定时派生短期 token，并留出余量。
- 把凭据状态暴露在接口上。`/token` 直接返回来源、有效性和到期时间，上线后核验只是一次普通请求。
- 掩盖失败的兜底只会把故障拖长。K 线存储回空不记日志，还把空答案缓了一小时。每个静默返回都该记原因，结果可能只代表「上游此刻挂了」时别做负缓存。

## 相关笔记

- [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
- [[zh/Cases/Design/2026-10-24-yahoo-request-budget-and-daily-bar-store|2026-10-24-yahoo-request-budget-and-daily-bar-store]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Glossary/JWT|JWT]] · [[zh/Glossary/TTL|TTL]] · [[zh/Glossary/SSH|SSH]] · [[zh/Glossary/PR|PR]]
