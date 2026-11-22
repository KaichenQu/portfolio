---
type: glossary
tags: [glossary]
---
# ADR

**全称**：Architecture Decision Record

架构决策记录。记下重要技术决定当时的背景、约束、最终方案、理由，以及排除了哪些方案，方便日后回看「当时为什么这么选」。这个仓库的 `Cases/Design/` 都按 ADR 的格式写。

![ADR 留存 Postgres 与 Mongo 的取舍及其理由，便于日后回看这次决定。](../Diagrams/adr.decision-record.svg)

和 [[zh/Glossary/RFC|RFC]] 的区别：RFC 是拍板前的讨论稿，ADR 是拍板后的记录。

用例：

> 为什么选 Postgres 没选 Mongo？写份 ADR 记下来，省得半年后再争一遍。

## 相关

- [[zh/Glossary/RFC|RFC]]
