---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 系统化排查

排查 bug 最常犯的错是凭感觉改一堆东西。问题没修好，还不知道哪一处改动起了什么作用。下面的做法更可靠。

![从预期与实际差异出发，设计一个结果能够否定假设的检查。](../Diagrams/systematic-troubleshooting.falsifiable-observation.svg)

## 适用场景

bug、测试失败、任何不符合预期的行为。越是看着简单的 bug，越需要按步骤查，因为问题往往就出在看似理所当然的假设上。

## 做法

1. 先拿到稳定的复现（[[zh/Glossary/repro|repro]]）。复现不了就先解决复现问题，否则什么修复都验证不了。
2. 读完完整报错。真正的原因常在堆栈跟踪中间或末尾。
3. 用一句话写清预期、实况，以及两者从哪里开始不一致。
4. 提出具体的假设，别停在「可能是环境问题」这种空泛说法。
5. 设计能证伪假设的最小观察，加行日志、跑个命令，或注释掉部分代码。
6. 执行后看结果。假设站得住就往下挖，证伪了就换假设。
7. 每次只改一个变量。同时改好几处，就算修好了，也不知道是哪一处起效。
8. 先找根因再修，别在「现象消失了」就停，问题可能只是让改动遮住了。

## 原理

核心是二分，每一步都把问题可能落在的范围减半。==每一步都得有明确、能证伪的假设，不能靠瞎猜。== **把已经验证的事实和猜测分开，只用事实往下推。**

## 注意与反例

- 还没复现就别开始「修」，因为无法判断修复是否生效。
- 别一下改 5 处。
- 可以凭直觉挑方向，每个直觉都要靠观察验证，不能直接信。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Glossary/RCA|RCA]]
