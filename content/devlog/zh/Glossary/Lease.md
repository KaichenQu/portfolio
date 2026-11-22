---
type: glossary
tags: [glossary, backend]
---
# Lease

**全称**：Lease (time-limited lock)

租约是对共享资源的限时占用。持有人占着期间，其他调用会被拒；如果持有人一直不释放，租约会自己到期，进程崩了也不会永远锁住资源。被拒的调用方一般拿到冲突错误，然后重试。

![卡片 1 持有任务租约时，卡片 2 会收到冲突错误，租约到期后可再尝试获取。](../Diagrams/lease.claim-expiry.svg)

用例：

> 卡片 1 后台的 `/executions/{id}/recover` 轮询占着任务租约，卡片 2 的 `POST /works` 于是返回 `409 TASK_ACTIVITY_CONFLICT`。客户端用同一身份最多重试 3 次。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Glossary/TTL|TTL]]
