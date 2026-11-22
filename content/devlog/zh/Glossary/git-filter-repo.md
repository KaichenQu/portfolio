---
type: glossary
tags: [glossary]
---
# git filter-repo

**全称**：git-filter-repo
**中文**：Git 历史重写工具

仍在维护的 `git filter-branch` 替代工具，用来重写仓库全量历史，删路径、清凭据或挪目录。重写后每个 commit 的 SHA 都会变，之前记下的 SHA 在重写后的仓库里就解析不到对应 commit 了。

![git filter-repo 重写派生仓库后，分叉前的提交 SHA 要到上游历史中查找。](../Diagrams/git-filter-repo.rewritten-identities.svg)

用例：

> fork 以前的 SHA 都被 git filter-repo 重写过了，直接从 upstream cherry-pick，别从这份历史里挑。

## 相关

- [[zh/Cheatsheets/git|git]]
