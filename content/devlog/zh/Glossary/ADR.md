---
type: glossary
tags: [glossary]
---
# ADR

**全称**：Architecture Decision Record

架构决策记录。记下重要技术决定的背景、当时的约束、选了什么、为什么这么选，以及放弃了哪些方案。以后回看时，还能知道「当时为什么会这么选」。这个仓库的 `Cases/Design/` 都按 ADR 的形式写。

![ADR 留存 Postgres 与 Mongo 的取舍及其理由，便于日后回看这次决定。](../Diagrams/adr.decision-record.svg)

[[zh/Glossary/RFC|RFC]] 是决定前拿来讨论的草案，ADR 是决定后的记录。

用例：

> 为什么选 Postgres？写份 ADR 把选它、没选 Mongo 的理由记下来，省得半年后再争一遍。

## 相关

- [[zh/Glossary/RFC|RFC]]
