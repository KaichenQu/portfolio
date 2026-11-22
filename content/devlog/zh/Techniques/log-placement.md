---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 日志位置

加日志是最基本也最管用的调试手段，但位置放错，等于没加。

![在边界前后使用同一个请求 ID 记录日志，就能找出值在哪里发生变化。](../Diagrams/log-placement.boundary-values.svg)

## 适用场景

挂不了调试器（生产、异步、并发或定时任务），或者想快速缩小范围。

## 做法

- 在边界加日志，比如函数入口和出口、跨模块或跨网络调用的前后、循环进出的位置。先找出数据从哪一跳开始不对。
- 记实际值，光写「到了这里」用处不大。把关键变量的内容、类型、长度打出来。很多 bug 就是值跟想的不一样。
- 成对记录，例如 `before X = ...` / `after X = ...`，一眼就能看出哪一步把值改坏了。这其实就是 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]。
- 异步或并发时带上 id，比如 request id、task id。日志交错后才看得出前因后果。
- 先粗后细。起初只记几个大边界，范围缩到某段后再加密日志。

## 原理

==bug 通常出在某处的实际状态和你以为的状态不一样。== 日志能把假设和实况摆在一起。两边开始对不上的那一跳，就是最可疑的位置。

## 注意与反例

- 查完记得删掉临时日志，或者用 debug 级别，别污染生产日志。
- 别一上来遍地加日志，先想清要验证哪个假设。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
