---
type: pattern
date: 2026-11-11
tags: [verification, refactoring, ci-cd, method]
---
# 基线比对验证

==基线本来就有检查失败，「行为没变」就靠和基线一致来证明，不靠全绿。== 先在基线 commit 上把所有检查跑一遍，之后每个提交都跑同一个脚本，逐项拿退出码和失败清单和那次基线运行比。

![基线已有失败时，两边运行相同检查，具体失败项和警告集合一致才支持行为未变。](../Diagrams/baseline-diff-verification-on-a-red-baseline.comparison.svg)

## 适用场景

重构、清理或不动依赖的改动，要求不改行为；而没改动的代码树在你这台机器上就有红的检查：测试失败、缺浏览器二进制、沙箱让某些测试套件跑不起来。要求全绿，就得先修这些失败，而修失败本身就是行为改动，也不在任务范围里。

## 做法

1. 在基线 commit 上，把每项检查跑进各自的目录：每项一份日志，外加一行汇总，记 `id`、退出码和耗时。再把每项检查的失败清单提出来（失败的测试 id、去掉行号的警告行、诊断条数），以及构建产物按扩展名的字节总数和带内容哈希的文件名。
2. 每个提交之后，用同一个脚本跑进新目录。两次运行之间改了脚本，就重跑基线。
3. 用脚本比，不要靠眼睛：每项检查输出一行 SAME 或 DIFF，比退出码、失败清单是否一致、警告集合和条数，以及按扩展名的包字节数。

```text
== web unit tests
web failure list SAME
== lint warnings (base new)
249 249
lint warning set SAME (line numbers ignored)
```

4. 出现 DIFF 就停下，不进下一个提交。先解释清楚：要么撤回这个提交，要么证明差异是噪声（第 5 步）。
5. 可能是噪声的检查（对负载敏感的测试、不确定的构建），先单独重跑，或者把基线多构建几次，再决定差异算在改动头上还是放过。

## 原理

失败的检查照样提供信息：哪些测试失败、多少条警告、构建写出哪些文件。改动如果没有影响，这些全都不变。比完整的失败清单而不只比退出码，能抓到修好一个失败又弄坏另一个、退出码始终是 1 的提交。

## 注意与反例

- 比对的可信度取决于基线能不能重复。信字节数或哈希之前，基线先构建三到五次；产物来回切换，就和基线的几种产物一起比（[[zh/Agents/check-build-determinism-before-comparing-bundle-bytes|比包体积之前先确认构建可重复]]）。
- 比警告行之前先去掉行号，不然文件上方一处无关的改动，会让下面的警告看起来像新出现的。
- 基线没跑过的检查没有比较对象，记成「基线没跑」，不要把它的通过算进去。
- 本地栈跑不了的检查（缺后端、需要数据库的测试套件）不在覆盖范围内，结果里要写明。
- CI 和本地基线可能往任一方向不一致。这次 CI 通过了本地失败的测试；改动仍然是拿本地基线来比。

## 相关

- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
- [[zh/Glossary/CI-CD|CI-CD]]
