---
type: case-design
date: 2026-10-15
tags: [design, backend, concurrency, admission, cli, ops]
status: solved
publish: true
---
# 结构 Run 的并行度与池容量

试用站把结构 run 的并发数 N 从 1 调到 2 后，所有新 run 都失败了。==permit 池第一次用时把容量写进了数据库，后来改 env 文件里的 N，就和库里存的那行对不上，每次准入都报 `EXECUTION_RESOURCE_CONFIG_CHANGED`。==

[[zh/Glossary/PR|PR]] ▒▒▒▒ 定下的解法：新增 `trial_cli set-capacity` 命令重写库里的容量，只要还有 permit 占着就拒绝执行；同时让排队位置把 N 个槽全算进去。改完两个 run 并排跑，各花约 104 s，串行估算要 195 s。

## 背景与约束

结构 **Run** 是试用站上的一次 CAD 编辑任务。run 启动前要过 **admission（准入）**，判断现在能不能开跑，还是得排队。

准入从 **permit 池**领凭证：容量为 N 的计数信号量（counting semaphore）。run 开跑领一个 permit（相当于预留），跑完归还；N 个 permit 全发出去后，后面的 run 进队列等。

开着试用授权时，池子第一次使用会把容量写进 `execution_resource_pools` 表。此后：

- env 文件里照旧是 N；
- 表里那行留着首次使用时的容量；
- 两边对不上，每次结构准入都抛 `EXECUTION_RESOURCE_CONFIG_CHANGED`。

▒▒▒▒ 之前，没有任何入口能改那一行。

基线复现：

| 步骤 | 结果 |
| --- | --- |
| N=1 跑一次 | 成功，库里存下容量 1 |
| 改 N=2，重启 | |
| 依次提交任务 A、任务 B | 两个立刻收到 `409` 拒绝 |

## 候选方案

### 方案 A：改 env 里的 N 再重启

- 做法：基线试的就是这个。
- 代价：比对时认的是库里那行，那行不动，所有准入照样失败，偏偏又没入口改它。

### 方案 B：显式命令重写存储的容量

- 做法：运维在主机上跑 `trial_cli set-capacity`。
- 优点：改容量是显式操作，改前改后的值直接打出来。
- 代价：上线多一步手工命令。

## 决定

选方案 B，在 ▒▒▒▒ 里拆成三个提交：

| 任务 | 提交 | 改动 |
| --- | --- | --- |
| T1 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `trial_cli set-capacity --kind structure` 或 `--kind prediction`；还有未释放预留时报 `EXECUTION_RESOURCE_IN_USE` 拒绝 |
| T2 | `▒▒▒▒▒▒▒▒▒▒▒▒` | 排队位置计入全部 N 个槽 |
| T3 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `docs/structure-▒▒▒▒▒▒▒▒▒▒▒▒`、`deploy/trial/README.md` |

▒▒▒▒ 在 2026-10-15 04:42 UTC 合并，合并提交 `▒▒▒▒▒▒▒▒▒▒▒▒`，pytest 通过数从 135 涨到 140。

==`set-capacity` 只在 permit 全部空闲时才改容量。== 命令到达时只要还有 run 占着 permit，就报 `EXECUTION_RESOURCE_IN_USE` 失败，库里那行原封不动。

### 排队位置

页面给每个排队 run 显示前面还有几个。T2 按这条式子算：

```
runs_ahead = max(0, holding + older - (N - 1))
```

按变量名理解，`holding` 是正占着 permit 的 run，`older` 是排在自己前面的待运行 run。前面占用的 permit 降到 N 个以下时这个 run 就能起，所以前面得先结束 `holding + older - (N - 1)` 个。记录到的数字跟这吻合：

| Run | holding | older | N | runs_ahead |
| --- | --- | --- | --- | --- |
| 第三个 run，C | 2 | 0 | 2 | 1 |
| 第四个 run | 2 | 1 | 2 | 2 |

第三个 run 是实测的，第四个 run 的 `runsAhead=2` 目前只有单元测试覆盖。

## 数据流

![A 与 B 同时占用两个许可，C 排队时前方计一项，许可释放后开始运行。](../../Diagrams/2026-10-15-structure-run-parallelism-capacity.queue-timeline.svg)

▒▒▒▒ 实测数据（N=2）：

| 测量项 | 值 |
| --- | --- |
| 单独运行，任务 A | 98.0 s |
| 单独运行，任务 C | 96.4 s |
| 并行运行 A | 103.9 s |
| 并行运行 B | 104.0 s |
| A 与 B 提交间隔 | 65 ms |
| A 和 B 串行估算 | 195 s |
| 第三个 run 位置 | `runsAhead=1`，页面显示「排队中 · 前面还有 1 个」 |
| B 结束到 C 开始 | 0.35 s |
| C 耗时 | 97.8 s |
| `set-capacity` 输出 | `previousCapacity` 1 → `capacity` 2 |

并行跑下来，A 比单跑多花 5.9 s；A 和 B 全部跑完，比串行估算省了将近一半。

run 并行期间，编辑 [[zh/Glossary/Lease|lease]] 照常生效（lease 即租约，对任务的限时占用）。A 运行时，另一个浏览器上下文去抢 A 的编辑权，收到 `409 TASK_EDIT_OCCUPIED`，那边 A 的页面切为只读（「其他窗口正在编辑，当前可查看与下载。」）。

### 试用部署主机上线

| 项目 | 值 |
| --- | --- |
| 执行人 | 负责人，2026-10-15 04:50Z |
| 输出 | `previousCapacity` 1 → `capacity` 2 |
| 健康状态 | ok |
| 之后的 N | 2 |

后来有份 10/17 的运维记录转进任务简报（简报未复核），记着主机结构并发已从 2 调到 4：

```
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒=4
```

env 文件备份为 `api-env.bak-20261017T031414Z`。

## 不做（YAGNI）

- **预计等待时间（T5）。** 负责人决定不做，页面只展示排队位置。
- **第四个 run 位置的实测。** `runsAhead=2` 有单测，没在本地栈上实跑。
- **按实测数据定 N。** 从 2 调到 3 原定看一周的 planning 延迟和 `RUNTIME_EXCEEDED` 次数。简报没记这次评审，上面 2 到 4 的改动来自另一份运维记录。

## 教训与技巧

- **首次使用时落库的上限是数据库状态。** 容量写进库里后，env 里的数字只代表期望值；要改得靠命令重写那一行，重启不会动它。
- **信号量容量只在空闲时改。** 还有预留没还时 `set-capacity` 直接拒绝，就不会出现 run 还拿着 permit、池子容量却在脚下变了的情况。
- **排队位置必须算进所有槽位。** 有 N 个槽时，前面占用的 permit 少于 N 就能轮到自己，算前面还有几个要减 N - 1，不是减 0。
- **并行耗时对照两条基线看。** 单跑耗时（A 是 98.0 s）看出共享主机给每个 run 添了多少开销（5.9 s），串行估算（195 s）看出并行赚回多少时间。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/PR|PR]]
