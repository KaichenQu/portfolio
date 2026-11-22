---
type: glossary
tags: [glossary, backend]
---
# Idempotency key

**全称**：Idempotency key (client-generated request identifier)

幂等键是客户端附在新增或修改请求上的唯一值。服务端记下这个 key，重试带同样的值就返回原来那次的结果，不再新建第二份对象。它解决的是响应丢失问题：客户端拿不准请求到没到，也能放心重发。

![响应丢失后，用相同的 createId 重试 POST /works 会返回原来的 Work。](../Diagrams/idempotency-key.lost-response-retry.svg)

用例：

> 结构助手在第一次 `POST /works` 前生成并持久化 `createId`。响应丢了就拿原来的 `createId` 重试，服务端会映射到原来的 Work，不会再建一份。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
