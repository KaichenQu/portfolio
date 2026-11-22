---
type: glossary
tags: [glossary, git]
---
# worktree

**全称**：git worktree（linked working tree）

让同一仓库同时有多个工作目录，各自检出不同分支，共用 1 套 `.git` 数据库，分支、stash 和配置各只存 1 份。比重新 clone 省空间，也不用在分支间来回切换。限制是同一分支不能同时在两个 worktree 检出。

![main 和 hotfix 工作目录各有自己的检出文件，共用同一个 .git 数据库。](../Diagrams/worktree.shared-history.svg)

```bash
git worktree add <path> <branch>
git worktree list
git worktree remove <path>
```

用例：

> 主目录留在 `main`，开个 worktree 做 hotfix，两边互不影响。

## 相关

- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]
- [[zh/Glossary/bisect|bisect]]
