---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 二分法定位故障

长链路上不确定哪一段出问题，直接从中间切开，看问题落在哪一半，再对那一半继续二分。

![在中间点观测，把前端到数据库的路径分成两半，下一次探测只查可疑段。](../Diagrams/binary-search-fault-localization.half-range.svg)

## 适用场景

- 长链路里某一环出问题，比如请求走前端 → 网关 → 服务 → DB，不知道断在哪一跳。
- 大段代码出了错，不清楚哪一行引入的。
- 提交历史里出现回归，不知道从哪个 commit 开始（直接用 [[zh/Glossary/bisect|bisect]]）。
- 配置或输入很长，不知道哪一段触发了 bug。

## 做法

1. 先定出两端：一头确定正常，一头确定异常。
2. 在中点加观察点，比如打日志、设断点、用 `curl` 请求中间节点，或者注释掉一半代码。
3. 判断问题落在前半段还是后半段，把正常的那一半排除。
4. 重复下去，直到范围小到一眼能看出问题。

## 原理

==每次排除一半，N 段链路大概只需 log2(N) 步。== 100 个 commit 里找回归只要 7 步，比逐个查快 1 个数量级。

## 注意与反例

- 故障得是单调的：过了某个点就稳定出错。要是偶发或不能稳定复现，二分会误判，得先把复现做稳定。
- 正常和异常的判定口径前后必须一致，否则越查越偏。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
- [[zh/Glossary/bisect|bisect]]
