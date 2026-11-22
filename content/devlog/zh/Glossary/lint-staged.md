---
type: glossary
tags: [glossary]
---
# lint-staged

**全称**：lint-staged
**中文**：暂存区代码检查

pre-commit runner，只给这次暂存待提交的文件跑 formatter 和 linter。它会先 stash 未暂存的改动，为此得遍历整个 worktree。沙箱如果禁止读取某个路径（比如 `**/.env*`），stash 就会失败，commit 还没开始检查就中止。

![lint-staged 备份遍历工作树时，lstat 被拒绝，暂存文件尚未开始检查。](../Diagrams/lint-staged.precommit-stash.svg)

用例：

> commit 在 lint-staged 里报 `lstat(".env.example"): Operation not permitted`，换到沙箱外重跑。

## 相关

- [[zh/Agents/env-file-protection-patterns-fire-on-non-secret-operations|env-file-protection-patterns-fire-on-non-secret-operations]]
