---
type: pattern
date: 2026-06-20
tags: [debug, git, method]
---
# git bisect 的回归定位

把 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 用在 git 历史上：原先正常的功能现在坏了（即 [[zh/Glossary/regression|regression]]），bisect 几步就能定位到引入问题的 commit。

![git bisect run 在每个中点运行同一个测试，直至报告首个异常提交。](../Diagrams/locating-regressions-with-git-bisect.automated-judge.svg)

## 适用场景

「上一版还正常，现在坏了」，且能用命令或固定步骤判别好坏。

## 做法

手动：

```bash
git bisect start
git bisect bad                 # current (bad)
git bisect good <old-good-commit>  # last known-good version
# git automatically checks out the midpoint; test it, then:
git bisect good   # or bad
# repeat until it reports the first bad commit
git bisect reset  # done, back to the original branch
```

自动（能写出可复现判定脚本时最省力）：

```bash
git bisect start <bad> <good>
git bisect run <test-cmd>   # script exit code 0=good, nonzero=bad, range 1-124
git bisect reset
```

## 原理

把「逐个翻几百个 commit」缩成约 log2(N) 次判定。==自动模式只要写好一条判好坏的命令，剩下的全自动跑完。==

## 注意与反例

- 中间个别 commit 编不过，用 `git bisect skip` 跳过。
- 判定必须稳定。故障偶发不稳，bisect 会指错 commit。
- 找到 commit 只是第一步，后面还要看清里面哪一行改坏了。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Glossary/bisect|bisect]]
- [[zh/Glossary/regression|regression]]
- [[zh/Cheatsheets/git|git]]
