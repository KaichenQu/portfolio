---
type: case-design
date: 2026-10-15
tags: [design, backend, concurrency, admission, cli, ops]
status: solved
publish: true
---
# 结构 Run 的并行度与池容量

试用站点把结构 run 的并发数 N 从 1 调到 2 之后，所有新 run 都失败了。==permit 池第一次使用时把容量写进了数据库，之后在 env 文件里改 N，就和存下来的那一行对不上，每次准入都报 `EXECUTION_RESOURCE_CONFIG_CHANGED` 。==

[[zh/Glossary/PR|PR]] ▒▒▒▒ 的决定：加 `trial_cli set-capacity` 命令重写存储的容量，只要还有 permit 没释放，命令就拒绝执行。同一个 PR 还让排队位置把 N 个槽都算进去。之后两个 run 并排跑，各用约 104 s，而一个接一个跑估计要 195 s。

## 背景与约束

结构 **Run** 指试用站点上的一次 CAD 编辑任务。run 要先过 **admission（准入）**：判断它现在就能开始，还是得等。

准入从 **permit 池** 里取：容量为 N 的计数信号量（counting semaphore）。run 开始时拿一个 permit（相当于预留），结束时还回去；N 个 permit 全部发出去以后，下一个 run 就排队。

开启试用授权后，池第一次使用时会把容量写进 `execution_resource_pools` 表。之后：

- env 文件里仍然是 N；
- 表里那一行是第一次使用时的容量；
- 两者不一致，每次结构准入都报 `EXECUTION_RESOURCE_CONFIG_CHANGED` 。

▒▒▒▒ 之前，没有任何办法改那一行。

基线复现：

| 步骤 | 结果 |
| --- | --- |
| N=1 运行一次 | 成功；存下容量 1 |
| 设 N=2，重启 | |
| 先提交任务 A，再提交任务 B | 两个都立刻收到 `409` 拒绝 |

## 候选方案

### 方案 A：改 env 里的 N 再重启

- 做法：基线就是这么做的。
- 代价：比较时以存储的那一行为准，那一行不变，所有准入都失败。而当时没有办法改它。

### 方案 B：显式命令重写存储的容量

- 做法：`trial_cli set-capacity` ，由运维人员在主机上执行。
- 优点：改容量是一步明确的操作，会打印改前和改后的值。
- 代价：上线多一步。

## 决定

选方案 B，在 ▒▒▒▒ 里分三个提交：

| 任务 | 提交 | 改动 |
| --- | --- | --- |
| T1 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `trial_cli set-capacity --kind structure` 或 `--kind prediction` ；还有未释放的预留时，以 `EXECUTION_RESOURCE_IN_USE` 拒绝 |
| T2 | `▒▒▒▒▒▒▒▒▒▒▒▒` | 排队位置计入全部 N 个槽 |
| T3 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `docs/structure-▒▒▒▒▒▒▒▒▒▒▒▒` 、`deploy/trial/README.md` |

▒▒▒▒ 在 2026-10-15 04:42 UTC 合并，合并提交是 `▒▒▒▒▒▒▒▒▒▒▒▒` 。pytest 通过数从 135 增加到 140。

==`set-capacity` 只在 permit 全部空闲时才改容量。==命令到达时如果有 run 拿着 permit，命令就以 `EXECUTION_RESOURCE_IN_USE` 失败，存储的那一行保持原样。

### 排队位置

页面会告诉每个排队中的 run 前面还有几个。T2 这样算：

```
runs_ahead = max(0, holding + older - (N - 1))
```

从变量名看，`holding` 是当前持有 permit 的 run，`older` 是比这个 run 更早提交、还在排队的 run。前面的 run 占用的 permit 少于 N 个，这个 run 就能开始，所以前面必须先结束 `holding + older - (N - 1)` 个。记录到的数值符合这种理解：

| Run | holding | older | N | runs_ahead |
| --- | --- | --- | --- | --- |
| 第三个 run，C | 2 | 0 | 2 | 1 |
| 第四个 run | 2 | 1 | 2 | 2 |

第三个 run 是实测的。第四个 run 的 `runsAhead=2` 只有单元测试覆盖。

## 数据流

![A 与 B 同时占用两个许可，C 排队时前方计一项，许可释放后开始运行。](../../Diagrams/2026-10-15-structure-run-parallelism-capacity.queue-timeline.svg)

▒▒▒▒ 的实测数据，N=2：

| 测量项 | 值 |
| --- | --- |
| 单独运行，任务 A | 98.0 s |
| 单独运行，任务 C | 96.4 s |
| 并行运行 A | 103.9 s |
| 并行运行 B | 104.0 s |
| A 与 B 的提交间隔 | 65 ms |
| A 和 B 串行估算 | 195 s |
| 第三个 run 的位置 | `runsAhead=1` ，页面显示「排队中 · 前面还有 1 个」 |
| B 结束到 C 开始 | 0.35 s |
| C 耗时 | 97.8 s |
| `set-capacity` 输出 | `previousCapacity` 1 → `capacity` 2 |

并行时，A 比单独运行多花了 5.9 s。A 和 B 全部跑完，只用了串行估算的一半多一点。

run 并行时，编辑 [[zh/Glossary/Lease|lease]] 照样生效。lease（租约）是对任务的限时占用。A 运行期间，另一个浏览器上下文去抢 A 的编辑权，收到 `409 TASK_EDIT_OCCUPIED` ，那边 A 的页面变成只读（「其他窗口正在编辑，当前可查看与下载。」）。

### 试用部署主机上线

| 项目 | 值 |
| --- | --- |
| 执行人 | 负责人，2026-10-15 04:50Z |
| 输出 | `previousCapacity` 1 → `capacity` 2 |
| 健康状态 | ok |
| 之后的 N | 2 |

后来有份 10/17 的运维记录转进了任务简报，简报里没有复核。记录显示主机的结构并发从 2 提到了 4：

```
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒=4
```

env 文件备份为 `api-env.bak-20261017T031414Z` 。

## 不做（YAGNI）

- **预计等待时间（T5）。** 负责人决定不做。页面只显示排队位置。
- **第四个 run 位置的实测。** `runsAhead=2` 有单元测试，没有在本地栈上实际跑过。
- **按测量结果选 N。** 从 2 提到 3 留给一周的数据决定：planning 延迟和 `RUNTIME_EXCEEDED` 次数。简报没有记录这次评审；上面从 2 到 4 的改动来自另一份运维记录。

## 教训与技巧

- **首次使用时存下的上限是数据库状态。** 容量一旦存进数据库的一行，env 里的值就只是期望状态。要改它，得用命令重写那一行；重启不会动那一行。
- **信号量容量只在空闲时改。** 还有预留没释放时 `set-capacity` 拒绝执行，所以不会出现 run 拿着 permit、池的大小却在它底下变了的情况。
- **排队位置要计入每个槽。** 有 N 个槽时，前面的 run 占用的 permit 少于 N 个，这个 run 就能开始，所以计算时减去 N - 1，而不是 0。
- **并行耗时要和两条基线比。** 单独运行的时间（A 是 98.0 s）说明共用主机让每个 run 多花多少（5.9 s）；串行估算（195 s）说明并行省了多少。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/PR|PR]]
