---
type: glossary
tags: [glossary]
---
# git filter-repo

**全称**：git-filter-repo
**中文**：Git 历史重写工具

仍在维护的 `git filter-branch` 替代工具，可以重写仓库全量历史，删除路径、移除凭据或搬目录。重写后各 commit 的 SHA 都会变化，之前引用的 SHA 就不能在重写后的仓库里解析到对应 commit。

![git filter-repo 重写派生仓库后，分叉前的提交 SHA 要到上游历史中查找。](../Diagrams/git-filter-repo.rewritten-identities.svg)

用例：

> git filter-repo 重写了 fork 以前的 SHA，直接从 upstream cherry-pick，别从这份历史里挑。

## 相关

- [[zh/Cheatsheets/git|git]]
