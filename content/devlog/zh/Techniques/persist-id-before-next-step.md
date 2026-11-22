---
type: pattern
date: 2026-11-09
tags: [idempotency, recovery, frontend-state, workflow]
---
# 下一步之前先存 id

==客户端驱动多步链时，每个服务端分配的 id 都要先落进持久本地存储，再发依赖它的下一个请求。== 持久本地存储指比页面内存活得久的客户端存储，比如 `sessionStorage`。

这样客户端手里的 id 就给服务端可能持有的对象划了上限。恢复还是放弃，看本地状态就能定，只有一种模糊情况要查服务端。

## 适用场景

客户端连发一串请求，每步都要带前一步返回的 id，任意两步之间都可能崩溃或刷新。事后客户端得决定继续恢复还是放弃，手里能依赖的只有存下来的 id。

## 做法

1. 生成客户端 [[zh/Glossary/Idempotency key|idempotency key]]（幂等键，客户端随请求带上的唯一值，服务端靠它把重试认作同一请求），冻结请求 payload，两样都在第一条请求发出前持久化。写入失败就什么都不发。
2. 第 k 步返回 id_k 后，先持久化 id_k，再发第 k+1 步。
3. 重试复用已经存下来的 key 和 id，绝不重新生成。

![下一请求发出前持久化 id_k，崩溃或重载后就能凭它找到服务端的子对象。](../Diagrams/persist-id-before-next-step.crash-window.svg)

## 原理

每次写入都在可能新建对象的请求之前，所以看本地状态，总能知道服务端最多持有什么：

| 本地状态 | 服务端最多持有 |
| --- | --- |
| 什么都没存 | 什么都没有 |
| 只有 key | 第 1 步创建的对象 |
| 有 id_k，没有 id_k+1 | 第 k+1 步创建的对象；它是惰性的，要等第 k+2 步带 id_k+1 跑起来才生效 |
| 最终 id | 已完成对象，按这个 id 恢复 |

「惰性」（inert）指对象自己不干活，只有后续步骤带着它的 id 调用才起作用。

### 模糊情况

第 k+1 步丢了回包，客户端拿不准：服务端可能已经建好对象，只是客户端没收到。

放弃前，先列出服务端挂在 id_k 下面的子对象。有活着的就接回（re-bind，重新挂回这条链继续用），别直接假定一个都没有。

![执行响应丢失后，查已保存 Work 的子执行，就能决定接回已准备的执行还是放弃恢复。](../Diagrams/persist-id-before-next-step.abandon-check.svg)

## 注意与反例

- 回包可能丢的那一步，建出来的对象必须自己不干活（草稿、`prepared` 记录）。如果建完就立刻开跑，这个上限就不再是「惰性」。
- 父对象必须有列出子对象的接口，模糊情况才解得开。
- 存储写入相对下一条请求必须同步（`sessionStorage`、事务），不能用 debounce（防抖）延后保存，不然下一条请求可能在 id 存好之前就发出去了。
- [[zh/Glossary/Lease|Lease]]（租约，共享资源的限时锁）或锁冲突拿同一身份重试，绝不换新身份。

## 来源案例

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：create → prepare → authorize → submit，prepare 前存 `workId`，authorize/submit 前存 `executionId`；「放弃」先列 Work 下的 execution，有活着的就接回。

## 相关

- [[zh/Glossary/Idempotency key|Idempotency key]]
- [[zh/Glossary/Lease|Lease]]
