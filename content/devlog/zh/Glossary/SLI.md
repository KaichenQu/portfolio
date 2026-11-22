---
type: glossary
tags: [glossary]
---
# SLI

**全称**：Service Level Indicator

服务等级指标，用来衡量 [[zh/Glossary/SLO|SLO]] 或 [[zh/Glossary/SLA|SLA]] 有没有达标的实测数值，比如登录成功率、[[zh/Glossary/p99|p99]] 延迟。

![SLI 示例用实测 p99 延迟判断目标是否达成，让慢请求尾部仍然可见。](../Diagrams/sli.measure-against-target.svg)

用例：

> 这个 SLO 的 SLI 用 p99 延迟，别用平均值，平均值会误导人。

## 相关

- [[zh/Glossary/SLO|SLO]]
- [[zh/Glossary/SLA|SLA]]
- [[zh/Glossary/p99|p99]]
