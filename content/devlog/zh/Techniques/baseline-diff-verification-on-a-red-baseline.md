---
type: pattern
date: 2026-11-11
tags: [verification, refactoring, ci-cd, method]
---
# 基线比对验证

==基线本来就有检查失败，证明「行为没变」靠的是跟基线一致，不靠全绿。== 先在基线 commit 上把所有检查跑一遍，之后每个提交都跑同一个脚本，逐项拿退出码和失败清单跟那次基线运行对照。

![基线已有失败时，两边运行相同检查，具体失败项和警告集合一致才支持行为未变。](../Diagrams/baseline-diff-verification-on-a-red-baseline.comparison.svg)

## 适用场景

重构、清理或不动依赖的改动要求不改行为，而没改的代码树在本机上就已经有红灯：测试失败、缺浏览器二进制、沙箱里部分测试套件跑不起来。硬要求全绿就得先修这些失败，而修失败本身就是改行为，超出了任务范围。

## 做法

1. 在基线 commit 上把每项检查跑进各自目录：每项一份日志，加一行汇总记 `id`、退出码和耗时。同时提取失败清单（失败测试 id、去掉行号的警告行、诊断条数），以及构建产物按扩展名的字节总数和带内容哈希的文件名。
2. 每次提交后，用同一个脚本跑进新目录。两轮之间改过脚本，就得重跑基线。
3. 用脚本比，别用肉眼看：每项检查打一行 SAME 或 DIFF，比退出码、失败清单、警告集合与条数，以及按扩展名的包字节数。

```text
== web unit tests
web failure list SAME
== lint warnings (base new)
249 249
lint warning set SAME (line numbers ignored)
```

4. 出现 DIFF 立刻停下，不进下一提交。先查清原因：要么撤回提交，要么证明差异是噪声（见第 5 步）。
5. 怀疑是噪声的检查（对负载敏感的测试、不确定的构建），先单独重跑，或把基线连编几遍，再决定差异算在改动上还是放过。

## 原理

失败的检查一样有信息量：哪些测试失败、多少条警告、产出哪些文件。改动没影响行为，这些就全部不变。比完整失败清单而不只比退出码，能抓出修掉一个旧失败却引入一个新失败、退出码仍为 1 的提交。

## 注意与反例

- 比对靠不靠谱取决于基线能不能重复。信字节数或哈希前，基线先构建三到五次；产物来回切，就跟基线的几种产物一起比（[[zh/Agents/check-build-determinism-before-comparing-bundle-bytes|比包体积之前先确认构建可重复]]）。
- 比警告行前先去行号，不然文件上方一处无关改动，会让下面的旧警告看起来像新冒出来的。
- 基线没跑过的检查没有对照，记成「基线没跑」，别把它的通过算进去。
- 本地栈跑不了的检查（缺后端、需数据库的套件）不在覆盖范围，结果里写明。
- CI 和本地基线往哪个方向不一致都有可能。这次 CI 通过了本地挂掉的测试，但改动仍以本地基线为准。

## 相关

- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
- [[zh/Glossary/CI-CD|CI-CD]]
