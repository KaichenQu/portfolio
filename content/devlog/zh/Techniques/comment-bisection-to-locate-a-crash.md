---
type: trick
date: 2026-06-20
tags: [debug]
---
# 注释二分定位崩溃

大段代码里找不到哪里抛错，先注释掉后半段再跑。还崩溃，问题在前半段；不崩溃，问题在后半段。对出错的那一半继续做，两三轮就能缩到几行。

![注释崩溃代码块的后半段再运行，可判断故障在哪一半。](../Diagrams/comment-bisection-to-locate-a-crash.crash-half.svg)

这是 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 最粗糙也最快的用法，不用调试器。

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
