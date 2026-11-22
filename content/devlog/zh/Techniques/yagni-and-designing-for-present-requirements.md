---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# YAGNI 与当前需求

YAGNI = You Aren't Gonna Need It。将来可能用到的抽象、配置项和扩展点，现在先别加。

![先直接实现第一个实际用例，等第二个实际用例出现后，再找值得共用的部分。](../Diagrams/yagni-and-designing-for-present-requirements.abstraction-trigger.svg)

## 适用场景

设计或写代码时，一冒出「现在先做成可配置、可插拔，以后好扩展」的念头，就可以拿这条原则检查。

## 做法

- 只解决现在确实存在的需求。
- 一次性操作不必硬塞进通用框架。
- 不会发生的情况不用加错误处理或分支。
- 等第二个用例真出现了再抽象也不迟，到那时才知道合适的抽象长什么样。

## 原理

提前抽象靠猜，猜错的概率很高。==用错抽象比不抽象更糟。它没人用，增加阅读和修改成本，后来又因为「看起来很通用」而让人不敢动。== 真有两三个具体用例时，共性自然看得出来，抽象也就能落在正确的地方。

## 注意与反例

- YAGNI 并非「别做设计」。该划的模块边界（[[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]）还是得划。它针对为假想需求提前堆起来的复杂逻辑。
- 确信以后一定用得上、届时改动成本又极高的扩展点可以例外，例如面向公众的 API 版本管理。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]
