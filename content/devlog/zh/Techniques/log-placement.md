---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# 日志位置

打日志是最基本也最管用的调试手段，位置打错就白打。

![在边界前后使用同一个请求 ID 记录日志，就能找出值在哪里发生变化。](../Diagrams/log-placement.boundary-values.svg)

## 适用场景

挂不了调试器（生产环境、异步、并发、定时任务），或者想尽快缩小嫌疑范围。

## 做法

- 打在边界处：函数出入口、跨模块或跨网络调用前后、循环进出位置，先看数据在哪一跳开始不对。
- 记实际值，光打「到了这里」没用，把关键变量的内容、类型和长度打出来。很多 bug 就是值跟以为的不一样。
- 成对打，比如 `before X = ...` / `after X = ...`，一眼看出哪步把值改坏了，其实就是换了种形式的 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]。
- 异步或并发场景带上 id（request id、task id），日志穿插在一起时才看得清因果。
- 先粗后细：先在几个大边界打日志，范围缩小后再把日志打密。

## 原理

==bug 往往出在某处实际状态跟脑子里的假设对不上。== 日志把假设和现实摆在一起，两边分岔的那一跳就是最可疑的地方。

## 注意与反例

- 查完删掉临时日志，或调到 debug 级别，别污染生产日志。
- 别一上来满篇打日志，先想好要验证哪个假设再加。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
