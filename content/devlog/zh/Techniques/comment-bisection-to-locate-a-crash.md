---
type: trick
date: 2026-06-20
tags: [debug]
---
# 注释二分定位崩溃

大段代码里找不到哪行抛错，先注释掉后半段重跑：还崩就在前半段，不崩就在后半段。对着出问题的那一半继续切，两三轮就能缩到几行。

![注释崩溃代码块的后半段再运行，可判断故障在哪一半。](../Diagrams/comment-bisection-to-locate-a-crash.crash-half.svg)

这是 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 最粗暴也最快的用法，连调试器都不用开。

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
