---
type: glossary
tags: [glossary]
---
# SLO

**全称**：Service Level Objective

服务等级目标，定得比对外 [[zh/Glossary/SLA|SLA]] 更严的内部指标，用来留余量。比如对外承诺 99.9%，内部目标定 99.95%，真出问题也不会马上违反 SLA。

![内部目标设为 99.95%，可在可用性降到对外承诺的 99.9% 之前触发排查。](../Diagrams/slo.internal-margin.svg)

用例：

> SLO 定在 99.95%，连续两周不达标就该查容量了。

## 相关

- [[zh/Glossary/SLA|SLA]]
- [[zh/Glossary/SLI|SLI]]
