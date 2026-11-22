---
type: case-debug
date: 2026-11-05
tags: [debug, backend, db, python, fastapi, sqlalchemy, sqlite]
status: solved
publish: true
---
# 请求卡住后每 30 s 成批返回 500

▒▒▒▒ 试用环境用的是 FastAPI，后端是文件型 SQLite 数据库。出事时所有请求都卡住，然后成批返回 HTTP 500，每 30 s 一批。原因是两个池之间的**死锁**：worker 线程（anyio 线程池里替同步代码干活的线程）和数据库连接池（预先建好、供请求借用的一组连接）在互相等。死锁就是每一方都握着别人要的东西，谁也动不了。

==请求在 teardown（请求结束时的收尾代码）里归还连接，而 teardown 也要占 worker 线程。worker 线程全在等连接时，就没有连接能还回来。== 只有 30 s 的连接池超时能打断这种等待，而浏览器一重试，马上又锁死。

修复在 [[zh/Glossary/PR|PR]] ▒▒▒▒ 里：文件型 SQLite 不再用连接池，轮询时也不再每次都写库。

## 现象

- 时间：2026-11-05 01:34-01:45 UTC。
- 所有请求都卡住。每隔 30 s，一整批请求返回 HTTP 500。
- `GET /api/v1/version` 根本不碰数据库，也卡住了。
- 重启服务没用。

日志：

```
sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00
```

相关数值如下。overflow 是池满后允许临时多开的连接，`pool_timeout` 是借连接时最多等多久。

| 项目 | 数值 |
| --- | --- |
| Worker 线程 | 40（anyio 默认值） |
| 连接池 | `QueuePool` ，5 个固定 + 10 个 overflow = 15 个连接 |
| `pool_timeout` | 30 s |
| 轮询 | 每个浏览器标签页每 2 s 一次；每次轮询都写 `last_trusted_at` |
| 一次写盘 | 约 40 ms（估算值，表里只有这一项是估算） |
| 修复前的写入量 | 4 个标签页 = 每秒 2 次轮询 = 每分钟 120 次写入 |
| 锁死所需的最小突发 | 40 + 15 = 55 个请求同时到达 |

## 复现

这次事故是在模型里复现的，没有在线上环境复现。模型是个小型模拟程序，线程数、池大小、超时和轮询频率都和线上一样，每 50 ms 推进一步。它的自检断言了下面这些结果：

| 负载 | 模型结果 |
| --- | --- |
| 只有稳定轮询，1、4 或 8 个标签页，120 s | 从不锁死；没有超时批次 |
| 一次 55 个请求的突发，1、4 或 8 个标签页 | 40/40 个线程占满，15/15 个连接借出，连接池超时计时器在走 |
| 同样的负载，125 s 之后 | 大约每 30 s 一批超时；重试之后仍然锁死 |
| 打开修复，8 个标签页 | 线程占用接近 0，没有借出的连接，每 60 s 写 1 次，没有超时批次 |

这种规模的突发来自重启，或者所有标签页同时重连。讲解页演示的那次运行里，第 3 s 来了 55 个请求，大约 0.7 s 后系统锁死。到 33.7 s，连接池超时触发，整批请求失败，重试又立刻把系统锁死。

两个交互讲解页的数字都来自这个模型：[等距视图](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.isometric.html) 和 [组件流程图](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.flow.html) 。两个页面都是英文的。流程图页面从 esm.sh 加载 React 和 React Flow，要联网才能打开。

## 排查过程

原始材料只记了每个决定和它的证据，中间跑过的命令没有记录。

1. **重启。** 事故期间重启过服务，没用。后来模型表明，重启本身就是一次突发：所有客户端同时重连。

2. **把预测并发从 20 降到 1。** 这只是权宜之计。11/06 06:25 UTC，并发已经是 1，环境又锁死了。**所以并发不是原因。**

3. **读日志。** `QueuePool limit of size 5 overflow 10 reached` 表示 15 个连接全部借出。借出（checkout）就是从池里拿走连接，拿走的请求一直占着它，直到还回去。可是 `GET /api/v1/version` 不需要连接，也卡住了。所以短缺不只出在连接池上。

4. **数每个请求要占几次线程。** 路由是同步的，写的是 `def` 而不是 `async def` 。FastAPI 把同步代码放到 anyio 的 worker 线程池上跑，默认 40 个线程。数据库 session 来自同步的生成器依赖，也就是 `yield` 出 session 的 `def` 函数；`yield` 之后的代码就是 teardown，负责归还连接。路由还声明了 `response_model` ，FastAPI 会拿它校验返回值。加在一起，每个请求要占三次 worker 线程：

   | 次序 | 工作 |
   | --- | --- |
   | 1 | 跑路由；借出连接 |
   | 2 | 按 `response_model` 校验响应 |
   | 3 | teardown：把连接还给池 |

   两次之间，请求先放掉线程，再排队等下一个。新请求和 teardown 按到达顺序排队等线程（anyio 的 limiter 是 FIFO，先进先出）。

5. **找到读请求里的写操作。** 权限检查 `policy()` 在每个读请求上都会跑。每次轮询，它都要执行 `BEGIN IMMEDIATE` 、`UPDATE trial_installations.last_trusted_at` 、一次提交和一次 fsync。`BEGIN IMMEDIATE` 在事务开始时就拿 SQLite 的写锁，fsync 强制把数据写到磁盘。SQLite 同一时间只允许一个写者，所以所有轮询都在排队等写锁。排队期间，每个轮询都占着自己的连接和线程。

6. **建模。** 模型要回答的是什么样的负载会锁死系统。稳定轮询、每次写约 40 ms，即使 8 个标签页也从不锁死。55 个及以上的突发每次都锁死。这和现象对得上：触发条件是突发，并发设成 1 也挡不住突发。

## 根因

连接只能靠 teardown 归还，teardown 又要占 worker 线程。40 个线程、15 个连接，来一次 55 个请求的突发，两边就一起占满了：

1. 前 40 个请求占满 40 个线程，其中 15 个借走全部 15 个连接。
2. 这 15 个请求跑完路由，放掉线程，各自的 teardown 进入线程队列。
3. 突发里剩下的 15 个请求排得更靠前，FIFO 先把空出来的线程分给这批请求。拿到线程后，这批请求开始等连接。
4. 结果 40 个线程都在等连接，15 个连接在等 teardown，teardown 在等线程。

![40 个工作线程都在等已借出的 15 条连接，而归还连接的清理任务又在等待工作线程。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.wait-cycle.svg)

借出的连接不是 [[zh/Glossary/Lease|Lease]]（租约，到期会自动失效的占用）：它没有过期时间。唯一的出口是 `pool_timeout` 。30 s 一到，所有等待者都以 `sqlalchemy.exc.TimeoutError` 失败，整批请求返回 HTTP 500。浏览器把这批请求重试一遍，这又是一次同样规模的突发，环境再次锁死。

![连接取用等待 30 秒后整批返回 HTTP 500，浏览器重试同一批请求，再次触发锁死。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.relock-loop.svg)

每次轮询都写库，让每个请求占着连接和线程的时间更长。不过在模型里，没有突发时它不会让系统锁死。

## 修复

PR ▒▒▒▒，11/06 07:17 UTC 部署：

| 改动 | 修复前 | 修复后 |
| --- | --- | --- |
| 文件型 SQLite 的连接池 | `QueuePool` 5 + 10，`pool_timeout` 30 s | `NullPool` ：不用池，每个请求自己开连接 |
| SQLite busy timeout | 5 s | 30 s |
| PostgreSQL 的连接池 | 未记录 | 10 + 30 = 40，不少于 40 个线程，`pool_timeout` 5 s |
| `policy()` | 每次读都拿写锁 | 只读，不加锁 |
| `last_trusted_at` | 每次轮询都写 | 最多每 60 s 写一次 |

`NullPool` 在请求要连接时才打开连接，teardown 时关闭。没有共享的一组连接，也就没有请求要等别的请求 teardown。等待环里「等连接」这条边就没了。现在写者只在 SQLite 的 busy timeout 内等待。busy timeout 是 SQLite 允许写者等写锁的时长，超时就报错。

![NullPool 给每个 anyio 请求单独打开 SQLite 连接，写入只受 SQLite 忙等待时限约束。](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.after-fix.svg)

修复后，预测并发从 1 恢复到 20。

## 经验与技巧

- **如果某个池要靠另一个池上的工作来补回资源，两个池就可能互相死锁。** 这里的连接只能在 worker 线程上归还。要么去掉这个池，像文件型 SQLite 改用 `NullPool` 那样；要么让它的连接数不少于线程数，像现在的 PostgreSQL 连接池那样。
- **权宜之计管用，不能证明找到了原因。** 把并发从 20 降到 1 只是权宜之计；并发为 1 时又出事，才把并发排除掉。
- **不碰数据库的路由也卡住，说明耗尽的不只是数据库这边的资源。** `GET /api/v1/version` 卡住，是第一个迹象：耗尽的除了连接，还有线程。
- **小模型可以代替 [[zh/Glossary/repro|repro]]（能稳定复现问题的步骤或环境）。** 对比稳定负载和突发，就分清了「流量太大」和「某个规模的突发」，阈值（40 + 15）也是从模型里得出的。参见 [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]。
- **查一查读路径会写什么。** 权限检查每次轮询都写库并 fsync，把每个读请求都塞进了单写者队列。

## 相关

- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/repro|repro]] · [[zh/Glossary/PR|PR]]
