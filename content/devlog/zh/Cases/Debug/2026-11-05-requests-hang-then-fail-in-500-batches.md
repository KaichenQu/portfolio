---
type: case-debug
date: 2026-11-05
tags: [debug, backend, db, python, fastapi, sqlalchemy, sqlite]
status: solved
publish: true
---
# 请求卡住后每 30 s 成批返回 500

▒▒▒▒ 试用环境跑的是 FastAPI，后端是文件型 SQLite 数据库。出事时所有请求全卡住，每 30 s 成批返回 HTTP 500。原因是两个池子**死锁**了：worker 线程（anyio 线程池里跑同步代码的线程）和数据库连接池（预先建好、按需借用的连接）都在等对方。两边各占着对方要的资源不放，谁也动不了。

==连接要靠 teardown（请求结束时的收尾代码）归还，teardown 自己又要占 worker 线程。等 worker 线程全在等连接时，就没有连接能还回来。== 只有 30 s 的连接池超时能打破等待，浏览器一重试，很快又锁死。

[[zh/Glossary/PR|PR]] ▒▒▒▒ 修掉了这事：文件型 SQLite 去掉连接池，轮询不再每次都写库。

## 现象

- 时间：2026-11-05 01:34-01:45 UTC。
- 所有请求卡住，每 30 s 成批返回 HTTP 500。
- `GET /api/v1/version` 不碰数据库，也卡住了。
- 重启服务没用。

日志：

```
sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00
```

涉及的几组参数（overflow 是池满后允许临时多开的连接数，`pool_timeout` 是借连接的等待上限）：

| 项目 | 数值 |
| --- | --- |
| Worker 线程 | 40（anyio 默认值） |
| 连接池 | `QueuePool`，5 个固定 + 10 个 overflow = 15 个连接 |
| `pool_timeout` | 30 s |
| 轮询 | 每个浏览器标签页每 2 s 一次；每次轮询都写 `last_trusted_at` |
| 单次写盘 | 约 40 ms（估算，表里只有这一项是估算） |
| 修复前写入量 | 4 个标签页 = 每秒 2 次轮询 = 每分钟 120 次写入 |
| 锁死最小突发 | 40 + 15 = 55 个请求同时到达 |

## 复现

这次没在线上复现，写了个小模拟程序：线程数、连接池大小、超时和轮询频率照搬线上，每 50 ms 推进一步。跑自检得到这几组结果：

| 负载 | 模型结果 |
| --- | --- |
| 只有稳定轮询，1、4 或 8 个标签页，120 s | 从不锁死，没有超时批次 |
| 55 个请求的突发，1、4 或 8 个标签页 | 40/40 线程占满，15/15 连接全部借出，超时计时开始 |
| 同样负载，125 s 后 | 大约每 30 s 出一批超时，重试后仍然锁死 |
| 打开修复，8 个标签页 | 线程占用接近 0，无借出连接，每 60 s 写 1 次，无超时批次 |

重启服务或者所有标签页同时重连，都会产生这种规模的突发。讲解页演示的那次模拟，第 3 s 来了 55 个请求，约 0.7 s 后锁死；到 33.7 s 连接池超时，整批请求失败，重试一进来立刻又锁死。

两个交互讲解页的数据都来自这个模型（都是英文）：[等距视图](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.isometric.html)和[组件流程图](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.flow.html)。流程图页面从 esm.sh 加载 React 和 React Flow，需要联网打开。

## 排查过程

当时只记了每步的判断和依据，中间跑的命令没留下来。

1. **重启。** 出事时先重启了服务，没用。后来跑模型才明白，重启本身就是突发，所有客户端会在同一刻重连。

2. **把预测并发从 20 降到 1。** 这只是临时止血。11/06 06:25 UTC，并发已经是 1，环境再次锁死。**并发不是原因。**

3. **看日志。** `QueuePool limit of size 5 overflow 10 reached` 说明 15 个连接全部借出（checkout 指从池里借走连接，归还前一直占着）。但 `GET /api/v1/version` 不碰库也卡住，说明耗尽的不只是连接池。

4. **算每个请求要占几次线程。** 路由都是同步函数（`def`，没用 `async def`），FastAPI 会放到 anyio 默认 40 个线程的 worker 线程池上跑。数据库 session 来自同步生成器依赖，也就是 `yield` 出 session 的 `def` 函数，`yield` 后面的 teardown 负责还连接。路由还声明了 `response_model` 做返回值校验。算下来，每个请求要占三次 worker 线程：

   | 次序 | 工作 |
   | --- | --- |
   | 1 | 跑路由，借出连接 |
   | 2 | 按 `response_model` 校验返回值 |
   | 3 | teardown，把连接还回池里 |

   每两步之间，请求先放掉线程，再重新排队等下一个。新请求和 teardown 排同一条队，按到达顺序领线程（anyio 的 limiter 是 FIFO，先进先出）。

5. **找出读请求里的写操作。** 权限检查 `policy()` 每次读请求都要跑。每次轮询都会依次执行 `BEGIN IMMEDIATE`、`UPDATE trial_installations.last_trusted_at`、提交和 fsync。`BEGIN IMMEDIATE` 在事务开头就拿 SQLite 写锁，fsync 强制把数据刷盘。SQLite 同一时间只允许一个写者，所有轮询都在排队等写锁，排队时手里还占着连接和线程。

6. **建模验证。** 写模型就为了搞清哪种负载会锁死。按单次写约 40 ms 算，开 8 个标签页稳定轮询多久都不会锁；只要来 55 个及以上的突发，每次必锁。这跟线上对上了：触发条件就是突发，并发设成 1 挡不住。

## 根因

还连接靠 teardown，teardown 又要占 worker 线程。40 个线程、15 个连接，同时来了 55 个请求，两边就会一起占满：

1. 前 40 个请求占满 40 个线程，其中 15 个借走全部 15 个连接。
2. 这 15 个请求跑完路由放掉线程，各自的 teardown 排进线程队列。
3. 突发里剩下的 15 个请求来得更早，FIFO 先把腾出的线程分给它们，拿到线程后开始等连接。
4. 结果 40 个线程全在等连接，15 个连接全在等 teardown，teardown 又全在等线程。

![40 个工作线程都在等已借出的 15 条连接，而归还连接的清理任务又在等待工作线程。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.wait-cycle.svg)

借出去的连接不是 [[zh/Glossary/Lease|Lease]]（租约，到期自动失效的占用），没有过期时间。唯一的出口是 `pool_timeout`。30 s 一到，等连接的请求全报 `sqlalchemy.exc.TimeoutError`，整批返回 HTTP 500。浏览器自动重试这批请求，又是一次同样规模的突发，环境再次锁死。

![连接取用等待 30 秒后整批返回 HTTP 500，浏览器重试同一批请求，再次触发锁死。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.relock-loop.svg)

每次轮询写库拉长了每个请求占连接、占线程的时间。不过模型里只要没有突发，光靠它不会锁死。

## 修复

PR ▒▒▒▒，11/06 07:17 UTC 部署：

| 改动 | 修复前 | 修复后 |
| --- | --- | --- |
| 文件型 SQLite 连接池 | `QueuePool` 5 + 10，`pool_timeout` 30 s | `NullPool`：不用池，每个请求单开连接 |
| SQLite busy timeout | 5 s | 30 s |
| PostgreSQL 连接池 | 未记录 | 10 + 30 = 40，不少于 40 个线程，`pool_timeout` 5 s |
| `policy()` | 每次读都拿写锁 | 只读，不加锁 |
| `last_trusted_at` | 每次轮询都写 | 最多每 60 s 写一次 |

`NullPool` 按需开连接，teardown 时直接关掉。没有共享连接池，谁也不用等别人跑 teardown，死锁环里「等连接」这条边就断了。写请求现在只受 SQLite 的 busy timeout（等写锁的时限，超时报错）约束。

![NullPool 给每个 anyio 请求单独打开 SQLite 连接，写入只受 SQLite 忙等待时限约束。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.after-fix.svg)

修复后，预测并发从 1 调回了 20。

## 经验与技巧

- **两个池子，如果这边要靠那边跑任务才能还回资源，就可能互相死锁。** 这里归还连接必须走 worker 线程。解法有两条：像文件型 SQLite 换 `NullPool` 去掉池子，或者像现在的 PostgreSQL 连接池，把连接数配到不少于线程数。
- **临时止血见效，不代表找对了根因。** 并发从 20 降到 1 只是权宜之计，并发为 1 时再次出事，才把并发排除掉。
- **不碰库的接口也卡住，说明耗尽的不只是数据库资源。** `GET /api/v1/version` 卡住，是最早的信号：线程和连接一起用完了。
- **小模型可以代替 [[zh/Glossary/repro|repro]]（稳定复现问题的步骤或环境）。** 对比稳定负载和突发，分清了「流量太大」和「达到阈值的突发」，40 + 15 这个门槛也是模型算出来的。参见 [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]。
- **查一查读路径有没有写库。** 权限检查每次轮询都写库加 fsync，把所有读请求都拖进了单写者队列。

## 相关

- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/repro|repro]] · [[zh/Glossary/PR|PR]]
