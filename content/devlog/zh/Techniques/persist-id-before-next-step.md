---
type: pattern
date: 2026-11-09
tags: [idempotency, recovery, frontend-state, workflow]
---
# 下一步之前先存 id

==客户端驱动多步链时，每个服务端分配的 id 都要先写进持久的本地存储，再发依赖它的请求。==持久的本地存储指比页面内存活得久的客户端存储，比如 `sessionStorage` 。

这样客户端手里的 id 就给服务端可能持有的东西划了上限。恢复还是放弃，看本地状态就能判断，只有一种模糊情况需要读服务端。

## 适用场景

客户端发一串请求，每一步都要用上一步返回的 id。任意两步之间都可能崩溃或刷新。之后客户端得决定是恢复这条链还是放弃，而它只能依据手里还剩的 id。

## 做法

1. 生成客户端的 [[zh/Glossary/Idempotency key|idempotency key]]（幂等键），冻结请求 payload。idempotency key 是客户端附在请求上的唯一值，服务端靠它把重试认作同一个请求。两样都在第一个请求之前持久化。写入失败就什么都不发。
2. 第 k 步返回 id_k 后，先持久化 id_k，再发第 k+1 步。
3. 重试复用已经持久化的 key 和 id，从不重新生成。

![下一请求发出前持久化 id_k，崩溃或重载后就能凭它找到服务端的子对象。](../Diagrams/persist-id-before-next-step.crash-window.svg)

## 原理

每次写入都发生在可能新建对象的请求之前。所以本地状态总能告诉你，服务端最多持有什么。

| 本地状态 | 服务端最多持有 |
| --- | --- |
| 什么都没存 | 什么都没有 |
| 只有 key | 第 1 步创建的对象 |
| 有 id_k，没有 id_k+1 | 第 k+1 步创建的对象；它是惰性的，要等第 k+2 步带着 id_k+1 运行才起作用 |
| 最终 id | 已完成的对象；按这个 id 恢复 |

「惰性」（inert）指对象自己什么都不做，只有后面的步骤用到它的 id 才有意义。

### 模糊情况

第 k+1 步的响应丢了，客户端就拿不准：服务端可能已经建了对象，只是客户端没见过。

放弃之前，先列出 id_k 的子对象，也就是服务端挂在它下面的对象。有活着的就接回（re-bind），把它重新当作这条链要接着用的对象，不要直接假定一个都没有。

![执行响应丢失后，查已保存 Work 的子执行，就能决定接回已准备的执行还是放弃恢复。](../Diagrams/persist-id-before-next-step.abandon-check.svg)

## 注意与反例

- 响应可能丢失的那一步，创建的东西必须自己不做事（草稿、`prepared` 记录）。如果它一创建就开始干活，这个上限就不再等于「惰性」。
- 父对象必须提供列出子对象的接口，模糊情况才有办法解决。
- 存储写入相对下一个请求必须是同步的（`sessionStorage` 、事务），不能用 debounce（防抖）保存。debounce 保存会延后执行，下一个请求可能在 id 存好之前就发出去了。
- [[zh/Glossary/Lease|Lease]] 或锁冲突用同一个身份重试，绝不换新身份。Lease（租约）是对共享资源有时限的锁。

## 来源案例

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：create → prepare → authorize → submit，prepare 之前持久化 `workId` ，authorize/submit 之前持久化 `executionId` 。「放弃」先列出 Work 下的 execution，有活着的就接回。

## 相关

- [[zh/Glossary/Idempotency key|Idempotency key]]
- [[zh/Glossary/Lease|Lease]]
