---
type: glossary
tags: [glossary, backend]
---
# Idempotency key

**全称**：Idempotency key (client-generated request identifier)

幂等键是客户端附在新增或修改请求上的唯一值。服务端记住这个 key，重试带同样的值，就返回原来那次的结果，不会再创建对象。这样即使响应丢了，客户端不知道请求有没有送达，也能安全重发。

![响应丢失后，用相同的 createId 重试 POST /works 会返回原来的 Work。](../Diagrams/idempotency-key.lost-response-retry.svg)

用例：

> 结构助手在第一次 `POST /works` 前生成并持久保存 `createId`。响应丢了就用原来的 `createId` 重试，服务端会找到原来的 Work，不会再建一份。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
