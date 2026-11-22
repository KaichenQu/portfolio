---
type: glossary
tags: [glossary]
---
# TDD

**全称**：Test-Driven Development

测试驱动开发。先写一条会失败的测试，再写刚好让它通过的代码，最后重构，这就是红灯、绿灯、重构的循环。好处是促使你提前想清行为和接口，还顺带留下一张防回归的安全网。

![TDD 示例先让自选列表测试失败，用最小改动打开抽屉后通过，再重构并保持测试通过。](../Diagrams/tdd.red-green-refactor.svg)

用例：

> 这块边界情况很多，用 TDD，先把情况一条条写成测试。

## 相关

- [[zh/Glossary/CI-CD|CI-CD]]
- [[zh/Glossary/regression|regression]]
