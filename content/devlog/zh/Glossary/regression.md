---
type: glossary
tags: [glossary]
---
# 回归（regression）

原本能用的功能被某次改动弄坏了。查是哪次改动引入的回归，常用 [[zh/Glossary/bisect|bisect]]。

![正常版本与异常版本限定排查范围，git bisect 用于找出第一个改变行为的提交。](../Diagrams/regression.first-breaking-change.svg)

用例：

> 上一版还好好的，这版坏了，是回归。跑 git bisect 找 commit。

## 相关

- [[zh/Glossary/bisect|bisect]]
- [[zh/Glossary/repro|repro]]
- [[zh/Glossary/RCA|RCA]]
