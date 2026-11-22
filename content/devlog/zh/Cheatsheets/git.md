---
type: cheatsheet
tags: [cheatsheet, git]
---
# git 排查速查表

只收排查用的命令，日常提交不在这里。

![根据要找的证据选 Git 命令，例如代码行作者、回归提交或丢失的引用。](../Diagrams/git.command-selection.svg)

## 作者与变更历史

```bash
git log -p <file>              # this file's change history (with diff)
git log -L <start>,<end>:<file># history of just these lines - useful for pinpointing changes
git blame <file>               # who last touched each line, and in which commit
git blame -L 40,60 <file>      # only lines 40-60
git show <commit>              # what a specific commit actually changed
```

## 引入回归的 commit

```bash
git bisect start <bad> <good>
git bisect run <test-cmd>      # automated bisection, see [[locating-regressions-with-git-bisect]]
git bisect reset
```

## 历史比对与搜索

```bash
git diff <a>..<b> -- <path>    # diff for one path between two revisions
git log -S "<string>"          # which commit added/removed this string (pickaxe)
git log -G "<regex>"           # same, but by regex
git log --oneline --graph --all
```

## 恢复与撤销

```bash
git reflog                     # recover "lost" commits/branches - the first move after a mistake
git restore --source=<commit> <file>  # restore a file to a specific version
git stash; git stash pop       # shelve changes temporarily to look at something else
git revert <commit>            # safely undo a commit that's already published
```

## 相关

- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]
- [[zh/Glossary/bisect|bisect]]
- [[zh/Glossary/CL|CL]]
- [[zh/Glossary/PR|PR]]
