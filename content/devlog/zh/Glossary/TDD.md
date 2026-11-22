---
type: glossary
tags: [glossary]
---
# TDD

**全称**：Test-Driven Development

测试驱动开发。先写会失败的测试，再写刚好够让它通过的代码，最后重构。这个循环叫红灯、绿灯、重构。它让人提前想清行为和接口，顺手留下一张防回归的网。

![TDD 示例先让自选列表测试失败，用最小改动打开抽屉后通过，再重构并保持测试通过。](../Diagrams/tdd.red-green-refactor.svg)

用例：

> 这里边界情况很多，用 TDD，先把情况逐个写成测试。

## 相关

- [[zh/Glossary/CI-CD|CI-CD]]
- [[zh/Glossary/regression|regression]]
