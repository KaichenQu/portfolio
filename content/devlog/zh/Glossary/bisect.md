---
type: glossary
tags: [glossary]
---
# bisect

**全称**：git bisect

沿提交历史做二分查找，快速定位是哪个 commit 引入了 [[zh/Glossary/regression|regression]]。标出一个已知正常、一个已知异常的版本，git 自动二分，你每步只需判断当前版本是好是坏。N 个 commit 大约需要 log2(N) 步。

![中点判定把可疑范围缩小一半，笔记中的回归排查在 200 个提交中用 8 次检查定位。](../Diagrams/bisect.midpoint-verdict.svg)

用例：

> 200 个 commit 里找回归，bisect 8 步就定位到了。

完整流程看 [[zh/Cheatsheets/git|git]] 速查表和 [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]。

## 相关

- [[zh/Glossary/regression|regression]]
- [[zh/Cheatsheets/git|git]]
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
