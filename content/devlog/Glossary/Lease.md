---
type: glossary
tags: [glossary, backend]
---
# Lease

**Full name**: Lease (time-limited lock)

A claim on a shared resource that the holder owns for a bounded time. Other callers are refused while the lease is held, and it expires on its own if the holder never releases it, so a crashed holder cannot block the resource forever. A refused caller usually gets a conflict error and retries.

Example usage:
> A background `/executions/{id}/recover` poll on card 1 held the task lease, so card 2's `POST /works` returned `409 TASK_ACTIVITY_CONFLICT`. The client retries up to three times with the same identity.

## Related
- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[persist-id-before-next-step]]
- [[TTL]]
