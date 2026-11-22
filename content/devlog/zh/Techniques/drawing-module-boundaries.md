---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# 模块边界

设计时把系统拆成小单元，最要紧的是边界画在哪里。

![因同一原因变更的代码放在同一模块内，调用方依赖模块的公开接口。](../Diagrams/drawing-module-boundaries.reason-to-change.svg)

## 适用场景

拆模块、文件或服务都适用。一个文件越长越大，往往就是该重划边界的信号。

## 做法

每个单元先交代清三件事：

1. 做什么，一句话说清唯一职责。
2. 怎么用，对外接口长什么样。
3. 依赖什么。

再用两条标准检验边界：

- **不看实现就能看懂它做什么。** 做不到，说明接口没设计好。
- **改内部实现不牵连调用方。** 牵连到了，说明边界漏出了实现细节。

==按变化原因拆分，别硬套技术分层。== 会一起改的放一起，无关的分开。

## 原理

边界划清楚，脑子里一次只用装一个单元，改动影响面可控，也方便测试。边界糊成一团时，接口漏出实现细节，改一处往往牵坏好几处。

## 注意与反例

- 别为「以后可能用到」提前抽象（[[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]）。边界随真实需求长出来，不能提前靠猜。
- 也别走另一极端：拆得过细，单元之间全剩胶水代码，够用就好。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/ADR|ADR]]
