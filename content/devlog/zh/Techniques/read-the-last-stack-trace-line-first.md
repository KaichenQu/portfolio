---
type: trick
date: 2026-06-20
tags: [debug]
---
# 堆栈跟踪的首尾阅读顺序

很多人扫一眼报错第一行就开始猜。堆栈跟踪（stack trace）最底层那帧通常才是真抛错的位置，上面都是调用链。先看最后一行找「在哪抛错」，再往回追「怎么走到那里」。

![先找抛错处：Python 把它排在调用帧末尾，JavaScript 排在调用帧开头。](../Diagrams/read-the-last-stack-trace-line-first.trace-order.svg)

Python 越往下越接近根因，JS 相反，越往上、越靠第一帧越接近抛错点。看栈前先分清方向。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- 可搭配 `explain-error-k` skill，用 DeepSeek 解释错误。
