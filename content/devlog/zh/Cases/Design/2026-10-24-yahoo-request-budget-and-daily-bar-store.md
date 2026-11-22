---
type: case-design
date: 2026-10-24
tags: [design, backend, frontend, cache, redis, rate-limit]
status: wip
---
# Yahoo 请求预算与日线库

KairoTrade 服务端要向 Yahoo 拉 sparkline 和日线。10/24 到 10/30 四次会话里，三项改动给服务端调 Yahoo 的频率设了上限：

1. **日内请求合批。** 服务端为日内 sparkline 调 Yahoo 的次数，从每天约 21,600 次（#80 初稿）降到工作日约 1,250 次。
2. **Redis 日线库。** 180 个标的，每个约 370 天，一次性填满后每个工作日补一次。
3. **公共数据 cache key 约定。** 统一写成 `public:<kind>:v<n>:<id>`，所有用户查同一份公共数据时共读一条缓存。

==预算控住靠两件事：所有上游调用挪进定时任务，页面只读服务端已有的数据。== 最后一步在 10/30，研究页报价也切成了读存储（#204）。

途中逐个核对了第三方数据源条款。StockTwits 只参考了渲染方式，没取任何数据。

## 背景与约束

- sparkline 是列表里标的名旁边那条小价格线，这里调 Yahoo spark 接口画，取一天内 15 分钟或 5 分钟收盘价。
- 请求过密时 Yahoo 回 HTTP 429（Too Many Requests），也就是它的 rate limit（限流，单位时间请求上限）。调度器和回填撞到 429 都会退避。
- 期货 `MES` 和 `MNQ` 实时数据不走 Yahoo，来自 TradingView feed，走 SSE（server-sent events，单向 HTTP 更新流），退避策略是 `LIVE_BACKOFF`。
- 部分候选数据源条款直接禁止自动访问，还没算请求量就先把可选范围划出来了。

源材料记的是改动前后状态，没留事前方案清单。下面按时间线写，附上每步数字。

## 10/24：日内请求预算

发布 [[zh/Glossary/PR|PR]] #85（`integration/ticker-1` → main，`1965311`）带了六个 PR，其中三个定下预算：

| PR | 改动 |
| --- | --- |
| #80 | 调度器按数据源设周期；spark `1d`/`15m`；每批 20 个标的；每个时段最多 3 次 Yahoo 请求；遇 429 停掉当前时段；日内源排队列前面 |
| #84 | 非交易时段 15 分钟一档里，限流标记保完整时段 |
| #81 | 浏览器自选列表、滚动行情条和行情表共用 `useIntradaySparks` 这一个 store，每 150 s 发一次批量请求 |

对比数字：

| 路径 | 之前 | 之后 |
| --- | --- | --- |
| 服务端 → Yahoo | #80 初稿：每时段每标的 1 次请求，52 个标的，≈ 21,600 次/天 | 每时段最多 3 次请求，工作日 ≈ 1,250 次/天 |
| 浏览器 → 服务端 | 自选列表、滚动行情条、行情表各自请求 | 每 150 s 一次批量 `/api/spark`；不再轮询报价快照 |
| 期货 | — | `MES`/`MNQ` 走 TradingView SSE，退避 `LIVE_BACKOFF` |

时段表能解释这两个数字。美东 04:00 到 20:00（含盘前盘后）每 2.5 分钟一个时段，其余时间每 15 分钟一个，一天共 384 + 32 = 416 个时段。下面这笔账是按时段表推出来的，不是从源材料抄的：

```
before:  52 symbols × 1 request  × 416 slots ≈ 21,600 requests/day
after:   ⌈52 / 20⌉ = 3 batches   × 416 slots ≈  1,250 requests/day
```

2.5 分钟周期跟对 StockTwits 的只读探测一致：它的批量接口缓存约 2.5 分钟。本站只照搬渲染方式（`svg` 里放 `polyline`，`viewBox 0 0 W 32`，描边 1.33）和刷新频率，没拿它的数据。

![前端共用迷你图数据源，按批控制请求量，独立任务则将日线价格合并到长期保留的 Redis 存储中。](../../Diagrams/2026-10-24-yahoo-request-budget-and-daily-bar-store.request-flow.svg)

### 数据源条款

同一次会话翻了所有在用和候选第三方数据源的条款：

| 数据源 | 条款 | 结果 |
| --- | --- | --- |
| StockTwits | §5 禁未经书面许可或批准 API 的自动抓取；API 文档页 404 | 不取数据，只参考渲染 |
| Quiver | §8 禁机器人访问；§6 规定 Quiver Data 限个人非商业用且不得再分发；商用要付费档 | 现有披露数据抓取与条款冲突，交负责人定 |
| Rallies | 页面由 JS 渲染；#30 记过 robots.txt 禁 `/api/`，条款禁爬取 | 只允许用带 key 的官方 API |
| ai4trade | 所有路径全回同一个 [[zh/Glossary/SPA\|SPA]] 外壳，无条款 | 无授权，不启用 |

10/29，#143 移除了 Rallies 数据源和它的模型排名。

## 10/25：spark 修复和日线库

三个 sparkline 修复直接进了 main：

| PR | 改动 |
| --- | --- |
| #87 | 去掉 `includePrePost`，Yahoo spark 接口见它就回 400，`1d` 快照已空了 13 小时 |
| #90 | 默认日内列表 22 个标的（6 只指数 ETF、11 只行业 ETF、4 只期货、NVDA），每时段 2 次请求 |
| #95 | 5 分钟 bar，一天 78 个点；sparkline 按 64×24 真实像素画，线宽 1.25，不拉伸 |

22 个标的按 20 个一批分，正好两批，所以每时段两次请求。

日线库（issue #92，PR #94，随发布 PR #97 上线）替代了每 12 小时重拉两年历史的做法：

| 项目 | 值 |
| --- | --- |
| 标的 | 180 个：`companyLogos.ts` 的 161 个加首页 22 个，去重后 |
| 存储 | Redis，列式数组，每标的约 370 天 |
| [[zh/Glossary/TTL\|TTL]] | 400 天 |
| 大小 | 每标的约 12 KB，总共 2-3 MB |
| 回填 | `range=1y`，请求间隔 2 s，分摊到每分钟 tick；遇 429 停 15 分钟 |
| 每日更新 | 工作日美东 20:30，`range=5d`，按日期合并 |
| 部署后检查 | 10 分钟后：AAPL 和 MSFT 各 250 根 bar，最后一根 2026-10-23 |

TTL（time to live）指条目进 Redis 后的存活时间，到期自动删。

日线每天的 Yahoo 请求数：

| 方案 | 请求数 |
| --- | --- |
| 旧：每 12 小时，每标的，两年历史 | ≈ 60/天 |
| 新：回填 | 180，一次性 |
| 新：之后 | 每工作日 180，另加每日内时段 2 次 |

新方案日线请求数比旧方案多，但覆盖 180 个标的，且每次只拉 5 天而不是两年。

## 10/29：K 线存储

#139 加了 K 线存储（Codex 做了两轮，评审提的九个黄色项全修完）。K 线就是蜡烛图上的一根 bar：开盘、最高、最低、收盘（OHLC）。

| 项目 | 值 |
| --- | --- |
| 期货 | `MES1!`、`MNQ1!`、`MGC1!`、`MCL1!`；5m、15m、1h、1d；各 600 根 |
| 日线 | 235 个标的加各个自选列表 |
| key 前缀 | `ohlcv:v1:` |
| 序列上限 | 48 |
| 活跃集合 | 约 6.5 MB，低于 Redis 的 128 MB 上限 |

数据来自 TradingView sidecar 的 `/history` 接口，调用失败时日线序列回退到 Yahoo。上线当天 sidecar 的 `/history` 一直在报错，存储始终是空的，故障记录见 [[zh/Cases/Debug/2026-10-26-tradingview-intraday-snapshots-stuck-pending|2026-10-26-tradingview-intraday-snapshots-stuck-pending]]。

#153 跟进四项：

- 每个静默返回都记 `reason`；
- 空结果不再做 1 小时负缓存（负缓存把「没有数据」也缓起来，免得下个调用方再问）；
- 拉取失败 5 分钟内重试；
- sidecar 请求超时从 12 s 提到 20 s。

## 10/30：公共数据缓存

issue #196 把共享行情数据统一到一套 key 约定：

```
public:<kind>:v<n>:<id>
```

所有用户共用这个 key；私有 key 则带上用户哈希。

cache key 是条目存进缓存用的名字，两个请求拼出同一个 key 就读同一条记录。版本段 `v<n>` 让格式变了直接写新条目，不误读旧条目。

| PR | 改动 | 评审后调整 |
| --- | --- | --- |
| #201 | 日内信号分块共享；key 留 7 天 | 上下文锚定到交易时段（306 根 bar 加当天）；提前收盘只计一次 |
| #202 | 长日线快照留 7 天，合并最新数据 | 刷新后的快照可修正历史；只对 404 做负缓存 |
| #203 | `data-sources` 缓 60 s；registry 去重；宏观数据只发缺项 | 驱逐的注册可恢复；无效判定 1 小时后重试 |
| #204 | 研究页报价改读存储；Finnhub 认证失败退避从 1 小时延到 24 小时 | 过期日内快照标 stale；12 行自选列表遇 429 只调 1 次而非 36 次 |
| #207 | key 辅助函数加静态测试 | 测试拒收空 key、手写私有 key 和按任意字段名缓存 |
| #208 | Redis 统计和 prompt 哈希日志 | 无 |

交叉评审：Codex 审了 #202 和 #203，claude2 审了 #201、#204 和 #207。

同时定下两条规矩：

- **公共路径读存储，未命中也不调上游。**
- **私有数据绝不进公共 key。** 审计没发现违规，日志里既没有 prompt 文本也没有用户 id。

线上实际命中率没测。

## 候选方案

源材料记下的前后对照：

| 问题 | 之前 | 之后 | 决定因素 |
| --- | --- | --- | --- |
| 服务端怎么向 Yahoo 要 sparkline | 每时段每标的一次请求 | 每批 20 个，每时段最多 3 次 | ≈ 21,600 vs ≈ 1,250 次/天 |
| 浏览器怎么拿 sparkline | 各组件单独请求 | 共用一个 store，每 150 s 一次批量请求 | 一条批量请求够三个组件用 |
| 日线历史从哪来 | 每标的每 12 小时重拉两年 | Redis 日线库，回填一次，每工作日 `range=5d` | 覆盖 180 个标的，每次只拉 5 天 |
| 取哪些第三方数据 | — | 只取条款允许的源 | StockTwits、Quiver、Rallies、ai4trade 条款 |
| 共享数据怎么缓 | — | `public:<kind>:v<n>:<id>`，静态测试把关 | 每条公共数据一份条目，共享 key 不混私有数据 |

## 决定

Yahoo 流量上限只由时段表和批大小决定，跟在线人数无关。页面只读共享 sparkline 批次、Redis 日线库或 `public:` key；调 Yahoo 的只有调度器、日线任务和回填三处，遇到 429 都会退避。

## 模块划分

| 单元 | 职责 |
| --- | --- |
| 时段调度器（#80、#84） | 每源一周期；每批 20 个；每时段最多 3 次请求；遇 429 停 |
| `useIntradaySparks`（#81） | 浏览器共享 store；每 150 s 一次批量 `/api/spark` |
| 日线库（#94） | Redis 存 180 个标的；从 Yahoo 回填和工作日更新 |
| K 线存储（#139、#153） | `ohlcv:v1:` 下存期货和日线 OHLC；数据取自 sidecar `/history` |
| key 辅助函数和静态测试（#207） | 生成 `public:` 和私有 key；拦住手写 key |

## 数据流

1. 调度器到点醒来，把标的列表按 20 个一批拆开，最多发 3 次 Yahoo 请求。
2. 服务端存下最新一批数据。
3. 每个打开的页面每 150 s 发一次 `/api/spark` 读这批数据。
4. 日线从 Redis 日线库读，日线任务工作日美东 20:30 更新。
5. sparkline 以外的共享数据放在 `public:` key 下，未命中不调上游。

## 范围之外（YAGNI）

- 50 个条目的 spark registry 各 range 共用；等首页真的把它挤满再给 `1d` 单开表。
- 2.5 分钟时段窗口没缩到美东 09:30-16:00。
- 日线库没收全量 S&P 500。
- 报价接口不带成交量和当日高低价，首页表格维持五列。
- 长日线快照（约 400 × 130 KB）要不要预热还没定。
- 公共响应的缓存头和轮询频率（#196 的 F7）没做。
- 主机 Redis 持久化和驱逐策略还没查，待跑 `redis-cli CONFIG GET save`。

参见 [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]。

## 经验与小技巧

- 请求预算写成算式：标的数、批大小、每天时段数。#80 初稿一乘出来，21,600 这个数就摆在眼前。
- 上游调用全收进调度器，页面只读它落下的结果，上游流量就只跟时段表走，不跟访问人数走。
- 写抓取前先翻数据源条款。这次四个数据源有三个在条款里禁止自动访问。
- 负缓存条件要收窄。#202 只缓 404，#153 不再缓空结果，空结果可能只是上游暂时挂了。
- 每个 cache key 带版本号 `v<n>`，格式一改直接写新条目，不误读旧数据。

## 相关笔记

- [[zh/Cases/Debug/2026-10-26-tradingview-intraday-snapshots-stuck-pending|2026-10-26-tradingview-intraday-snapshots-stuck-pending]]
- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/TTL|TTL]] · [[zh/Glossary/SPA|SPA]] · [[zh/Glossary/PR|PR]]
