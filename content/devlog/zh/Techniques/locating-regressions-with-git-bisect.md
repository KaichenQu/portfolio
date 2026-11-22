---
type: pattern
date: 2026-06-20
tags: [debug, git, method]
---
# git bisect 的回归定位

把 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 用到 git 历史上：能用的功能现在坏了（也就是 [[zh/Glossary/regression|regression]]），bisect 只用几步就能缩到引入问题的 commit。

![git bisect run 在每个中点运行同一个测试，直至报告首个异常提交。](../Diagrams/locating-regressions-with-git-bisect.automated-judge.svg)

## 适用场景

「上一版还好好的，现在坏了」，且能靠命令或固定步骤判断正常与异常。

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

自动（有可复现的判定脚本时最省事）：

```bash
git bisect start <bad> <good>
git bisect run <test-cmd>   # script exit code 0=good, nonzero=bad, range 1-124
git bisect reset
```

## 原理

把「翻几百个 commit」变成约 log2(N) 次判断。==自动模式只需要写好一条区分正常与异常的命令，剩下的自己跑。==

## 注意与反例

- 中间某些 commit 构建不了，就用 `git bisect skip` 跳过。
- 判定必须稳定。故障时有时无，bisect 就会指错 commit。
- 找到 commit 只是第一步，还要查明它具体哪行引入了问题。

## 来源案例

- [[zh/Maps/debugging-and-design-method|debugging-and-design-method]]

## 相关

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Glossary/bisect|bisect]]
- [[zh/Glossary/regression|regression]]
- [[zh/Cheatsheets/git|git]]
