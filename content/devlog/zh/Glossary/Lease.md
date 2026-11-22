---
type: glossary
tags: [glossary, backend]
---
# Lease

**全称**：Lease (time-limited lock)

租约是对共享资源的限时占用。持有人占着的期间，其他调用会遭拒。持有人一直没释放时，租约会自行到期，因此进程崩溃也不会永远占住资源。遭拒的调用者通常收到冲突错误，之后再试。

![卡片 1 持有任务租约时，卡片 2 会收到冲突错误，租约到期后可再尝试获取。](../Diagrams/lease.claim-expiry.svg)

用例：

> 卡片 1 的后台 `/executions/{id}/recover` 轮询占着任务租约，所以卡片 2 的 `POST /works` 返回 `409 TASK_ACTIVITY_CONFLICT`。客户端用同一身份最多重试 3 次。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Glossary/TTL|TTL]]
