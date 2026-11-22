---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# 模块边界

设计时把系统拆成小单元，最要紧的是边界画在哪里。

![因同一原因变更的代码放在同一模块内，调用方依赖模块的公开接口。](../Diagrams/drawing-module-boundaries.reason-to-change.svg)

## 适用场景

拆模块、文件或服务时都适用。文件一直长，往往是该重新划边界了。

## 做法

每个单元先说清三件事：

1. 它做什么，用一句话说清唯一职责。
2. 它怎么用，对外接口是什么样的。
3. 它依赖什么。

再用两条标准检查边界。

- **别人不读实现，能看出它做什么吗？** 看不出，接口就没设计好。
- **改内部实现会影响调用方吗？** 会影响，边界就漏出了实现细节。

==按变化原因拆分，别硬套技术分层。== 会一起改的放在一起，无关的分开。

## 原理

边界划得好，脑子里一次只用装一个单元，改动影响有边界，也容易测试。边界不清楚时，接口漏出实现细节，改一处容易连带弄坏好几处。

## 注意与反例

- 别为了「以后可能用到」提前抽象（[[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]）。边界随实际需求长出来，不能靠预先猜测。
- 也别走到另一头。拆得太细，单元之间就只剩胶水代码，拆到够用就好。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/ADR|ADR]]
