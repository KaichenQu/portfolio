---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 系统化排查

排 bug 最常踩的坑是凭感觉一通乱改：问题没修好，反倒不知道哪处改动起了什么作用。按下面步骤走靠谱得多。

![从预期与实际差异出发，设计一个结果能够否定假设的检查。](../Diagrams/systematic-troubleshooting.falsifiable-observation.svg)

## 适用场景

bug、测试失败、任何跟预期不符的行为。越是「看着简单」的 bug 越该按步骤查，毛病往往藏在觉得理所当然的假设里。

## 做法

1. 先拿到稳定复现（[[zh/Glossary/repro|repro]]）。复现不了先解决复现，不然任何修复都验不出来。
2. 读完完整报错，别只扫第一行。真正的原因常在堆栈跟踪中间或末尾。
3. 一句话写清预期是什么、实际发生了什么、两边从哪开始分岔。
4. 提具体假设，别停在「可能是环境问题」这种空话。
5. 设计能证伪假设的最小观察：加行日志、跑条命令，或者注释掉一段代码。
6. 跑完看结果：假设站得住继续深挖，证伪了马上换假设。
7. 每次只改一个变量。同时动好几处，就算修好了也分不清哪处起效。
8. 查清根因再修，别看到「现象没了」就收手，问题可能只是被改动掩盖了。

## 原理

底层思路是二分，每步都把问题可能落的范围砍半。==每步都要有明确、能证伪的假设，不能靠猜。== **把验证过的事实和猜测分开，只顺着事实往下推。**

## 注意与反例

- 没复现前别动手「修」，不然没法判断修没修好。
- 别一次改 5 处。
- 可以靠直觉选方向，但每个直觉都要用观察验证，不能直接信。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Glossary/RCA|RCA]]
