---
type: glossary
tags: [glossary]
---
# repro

**全称**：reproduce / reproduction

稳定重现 bug。稳定复现是调试的前提，否则无法验证修复到底有没有用。最小复现就是把触发条件删到仍能重现的最小集合。

![失败重试可以缩减为一次资源加载失败和一次重试操作，仍能看到没有发出新请求。](../Diagrams/repro.minimal-trigger.svg)

用例：

> 发我复现步骤，我现在这边还复现不了，有步骤才能接着查。

## 相关

- [[zh/Glossary/regression|regression]]
- [[zh/Glossary/bisect|bisect]]
