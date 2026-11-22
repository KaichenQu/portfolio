---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# YAGNI 与当前需求

YAGNI = You Aren't Gonna Need It。以后可能用得上的抽象、配置项和扩展点，现在先别加。

![先直接实现第一个实际用例，等第二个实际用例出现后，再找值得共用的部分。](../Diagrams/yagni-and-designing-for-present-requirements.abstraction-trigger.svg)

## 适用场景

设计或写代码时，刚冒出「先做成可配置、可插拔，以后好扩展」的念头，就拿这条原则过一遍。

## 做法

- 只解决眼下确有需求的问题。
- 一次性操作别硬套进通用框架。
- 不会发生的情况，别加错误处理，也别加分支。
- 等第二个实际用例来了再抽也不晚，到那时才知道合适的抽象该长什么样。

## 原理

提前抽象靠的是猜，猜偏的概率很高。==用错抽象比不抽象更糟：没人用，徒增阅读和修改成本，后面又因为「看着挺通用」让人不敢动。== 真攒出两三个具体用例，共性自然显出来，抽象也就能落在对的地方。

## 注意与反例

- YAGNI 不是「别做设计」，该划的模块边界（[[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]）照样得划。它防的是为假想需求提前堆复杂度。
- 确信以后必用、且届时改造成本极高的扩展点可以例外，比如面向公众的 API 版本管理。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]
