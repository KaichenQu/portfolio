---
type: trick
date: 2026-06-20
tags: [debug]
---
# 堆栈跟踪的首尾阅读顺序

很多人扫一眼错误第一行就开始猜。实际上，堆栈跟踪（stack trace）的最底层栈帧通常才是抛错的位置，上面都是调用链。先看最后一行找「在哪里抛错」，再往回追「怎么跑到那儿」。

![先找抛错处：Python 把它排在调用帧末尾，JavaScript 排在调用帧开头。](../Diagrams/read-the-last-stack-trace-line-first.trace-order.svg)

Python 越往下越接近根因。JS 则越往上、越靠近第一帧，越接近抛错点。先弄清当前看到的是什么顺序。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- 可搭配 `explain-error-k` skill，用 DeepSeek 解释错误。
