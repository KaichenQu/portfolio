---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 二分法定位故障

长链路上不知道哪一段出错，就从中间切开，确认问题在哪一半，再对那一半继续二分。

![在中间点观测，把前端到数据库的路径分成两半，下一次探测只查可疑段。](../Diagrams/binary-search-fault-localization.half-range.svg)

## 适用场景

- 长链路上某一环出问题。比如请求走前端 → 网关 → 服务 → DB，不知道断在哪一跳。
- 大段代码出了错，不清楚是哪行引入的。
- 某段历史里出了回归，不知道从哪个 commit 开始（用 [[zh/Glossary/bisect|bisect]]）。
- 配置或输入很长，不知道哪一部分触发了 bug。

## 做法

1. 找到明确正常和明确异常的两个点。
2. 在中间加观察点，比如日志、断点、用 `curl` 请求中间节点，或者注释掉一半代码。
3. 判断故障落在哪一半，把正常的那一半排除。
4. 重复，直到范围小到一眼能看出问题。

## 原理

==每次排除一半，N 段链路只需约 log2(N) 步。== 100 个 commit 里找回归只要 7 步，比逐个检查快约 1 个数量级。

## 注意与反例

- 前提是故障呈单调变化，过了某个点就稳定出错。故障偶发或不能稳定重现时，二分会误判，得先把复现做稳定。
- 正常和异常的判定标准要一致，否则越查越偏。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
- [[zh/Glossary/bisect|bisect]]
