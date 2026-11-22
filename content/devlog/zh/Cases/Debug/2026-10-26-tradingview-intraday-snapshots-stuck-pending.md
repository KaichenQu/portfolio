---
type: case-debug
date: 2026-10-26
tags: [debug, backend, infra, auth, python, tradingview]
status: open
---
# TradingView 日内快照卡在 SNAPSHOT_PENDING

KairoTrade 上，所有来自 TradingView 的日内序列（5m、1h）都变成了 `SNAPSHOT_PENDING` 状态，日线却一直正常。`SNAPSHOT_PENDING` 是序列还没有可用快照时显示的状态。

==`TV_TOKEN` 是有效期约 4 小时的 [[zh/Glossary/JWT|JWT]]，没有任何东西去续它。== JWT 是带签名的 token，自己携带过期时间，字段名是 `exp` 。过了这个时间，行情源（feed）就拉不到日内数据了。

修复是 [[zh/Glossary/PR|PR]] #109：feed 的 sidecar 在 token 到期前 10 分钟，从 TradingView 登录会话里取新 token。sidecar 是挨着主服务运行的独立小服务，这里指 feed VM 上替 API 跟 TradingView 通信的那个 Python 服务。

这个案例还没结。10/29 sidecar 的 `/history` 调用又开始失败，第二次故障的原因还没确定。

token 最初怎么拿到，见 [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]，它已经不是浏览器 cookie 了。本文从那之后讲起：手里已经有 token，但它会过期。

## 现象

| 日期 | 现象 | 未受影响 |
| --- | --- | --- |
| 10/25 | `MNQ1!`（CME_MINI）：所有周期都是 `SNAPSHOT_PENDING` | Yahoo `MNQ=F` 正常 |
| 10/26 | NVDA、`MNQ1!` 、`MES1!` ，5m 和 1h：全部 `SNAPSHOT_PENDING` | 日线正常 |

10/26 的影响范围是 TradingView 路径上的所有日内序列，股票和期货都在内。

## 复现

源材料没有记录刻意的复现。现象可以从 token 的有效期推出来：token 设置后约 4 小时，所有日内序列在同一时刻停止更新，并且一直停着，直到有人设置新 token。

## 排查经过

源材料记录了每次会话看到了什么、得出了什么结论，没有记录中间跑过的命令。

1. **10/25，只有一个期货根代码。** 只有 `MNQ1!` 是 pending。Yahoo 的 `MNQ=F` 正常，说明行情数据本身存在，出问题的只是 TradingView 路径。当晚记下的假设是 TradingView 订阅过期，下一步要查：

   ```bash
   journalctl -u tvfeed
   ```

   那次会话没有跑这条命令。

2. **10/26 下午，范围扩大。** NVDA 和 `MES1!` 也 pending 了，5m 和 1h 都是，日线却正常。股票和期货、所有日内周期一起失败，指向整条日内路径共用的某样东西。

   在 agent 会话里读 feed VM 的日志失败：

   ```
   Permission denied (publickey)
   ```

   留给负责人的备注是改从普通终端跑 `journalctl -u tvfeed` 。

3. **10/26 晚上，找到原因。** 这次会话确认 `TV_TOKEN` 是有效期约 4 小时的 JWT，一过期，所有日内序列都会变成 `SNAPSHOT_PENDING` 。源材料没写是哪条日志、还是解码出的哪个 `exp` claim 证明了这一点。

10/25 的猜测指向订阅，实际原因是 token 自身的有效期。

## 根因

==sidecar 用固定的 `TV_TOKEN` 做认证，这个 JWT 约 4 小时过期，而 sidecar 没有任何替换它的步骤。== 日线不靠这个 token 提供（10/25 Yahoo 的 `MNQ=F` 正常），所以所有日内序列停了，日线还照常工作。

![TV_TOKEN 有效期约四小时，提前十分钟刷新可避免日内请求进入 SNAPSHOT_PENDING。](../../Diagrams/2026-10-26-tradingview-intraday-snapshots-stuck-pending.refresh-timeline.svg)

## 修复

| 项目 | 值 |
| --- | --- |
| PR | #109（claude2），合并为 `162ea9a` |
| 改动 | sidecar 用 `TV_SESSIONID` + `TV_SESSIONID_SIGN` 请求 TradingView 的 `/chart/` 页面，从中取出新 token |
| 刷新 | 在后台运行，时间点是当前 token 到期前 10 分钟 |
| 测试 | 129 个 Python 单元测试通过 |
| 部署 | `rsync` 到 feed VM |

`TV_SESSIONID` 和 `TV_SESSIONID_SIGN` 存的是 TradingView 登录会话，名字和七月那个案例在浏览器里找到的 `sessionid` / `sessionid_sign` cookie 对应。现在 token 从会话派生，不再手工设置。

部署时跳过了 `pip` 步骤。feed VM 跑的是 Python 3.10，而 `requirements.txt` 钉死了 `pandas==3.0.6` ，它需要 3.11。下次加依赖之前得先解决这个问题。

部署后的检查：

```
/token          source: sessionid, valid, expires 2026-10-27T06:48Z
MES1! 5m        asOf 2026-10-27T02:20Z
NVDA 5m         asOf 2026-10-26T19:55Z
```

sidecar 的 `/token` 接口会报告当前 token 的来源和到期时间，所以做这个检查不需要登录 VM 的 shell。

## 10/29 第二次故障

三天后，新的 K 线存储一直是空的，顺着查下去又回到 sidecar。K 线就是 OHLC bar（开盘、最高、最低、收盘），K 线存储把这些 bar 存在 Redis 里。

| 时间（UTC） | 观察 |
| --- | --- |
| 01:06:53 | 旧行情路径最后一次成功调用 sidecar |
| 10:55 | 部署 `524bbd7` |
| 11:00-11:28 | `MES1!` 5m 仍是 01:06 那份 300 根 bar 的快照；`ohlcv-series` 的 `updatedAt` 为空 |
| 12:00:55 | NVDA 1d 回退到 Yahoo，说明 sidecar 的 `/history` 调用失败了 |
| 12:40 | 部署 `a8c0808`（#153）；`ohlcv-series` 仍为空 |

源材料确认的事：

- sidecar 的 `/history` 向 API 返回失败。
- 数据看不出这些失败是不是在 10:55 部署之前就开始了。
- 可能的诱因：部署后的冷启动会发出约 32 个请求，每个 600-1000 根 bar。

#153 没有修 sidecar，它缩短的是 sidecar 恢复之后的空窗：

| #153 的改动 | 值 |
| --- | --- |
| K 线存储里的静默返回 | 现在会记录 `reason` |
| 空结果 | 不再做 1 小时的 negative cache |
| 拉取失败 | 5 分钟内重试 |
| sidecar 请求超时 | 12 s → 20 s |

negative cache（负缓存）把“没有数据”这个答案也缓存起来，下一个调用方就不用再问。负缓存设成一小时，空答案在 sidecar 恢复之后最多还能再留一小时。

还没做的检查：从 01:00 起翻 feed VM 的日志，找 token 和 history 相关的错误。

```bash
ssh <feed-vm> "sudo journalctl -u tvfeed --since '2026-10-29 01:00' | grep -E 'No data returned|ERROR|Traceback|token|n_bars' | tail -80"
```

源材料要求确认 TradingView 的 session id 本身有没有过期。#109 的每个新 token 都从这个 session id 派生，session 过期的话，刷新也会一起停。这个问题还没人回答；另外八个期货根代码（ES、NQ、RTY、M2K、YM、MYM、CL、GC）要等 sidecar 恢复后才能验证。

## 经验与小技巧

- 某条路径上的所有序列同时失败，而另一条路径能正常提供同样的标的，先查失败路径上共用的东西（比如凭据），再去看具体标的或交易所。
- 带 `exp` 的 token 需要有人负责在 `exp` 之前续期。保留寿命更长的凭据（这里是登录会话），按计划从它派生短期 token，并在到期前留出余量。
- 把凭据状态放到接口上。`/token` 返回来源、有效性和到期时间，部署后的检查就变成了一次普通请求。
- 掩盖失败的兜底会让失败拖得更久。K 线存储返回空结果时不打日志，还把空答案缓存一小时。每个静默返回都要记录原因；结果可能只代表“上游此刻挂了”时，不要做负缓存。

## 相关笔记

- [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
- [[zh/Cases/Design/2026-10-24-yahoo-request-budget-and-daily-bar-store|2026-10-24-yahoo-request-budget-and-daily-bar-store]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Glossary/JWT|JWT]] · [[zh/Glossary/TTL|TTL]] · [[zh/Glossary/SSH|SSH]] · [[zh/Glossary/PR|PR]]
