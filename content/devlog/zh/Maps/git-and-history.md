---
type: moc
tags: [moc, git]
---
# Git 与历史

共 15 篇，三条线：找改动、找引入的人、重写或隔离改动。

![Git 二分查找何时坏掉，历史搜索查谁引入，工作树与索引分别用于判定隔离及暂存。](../Diagrams/git-and-history.history-questions.svg)

## 引发故障的改动

- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]：用 `git bisect run` 自动二分。
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]：bisect 背后的通用思路。
- [[zh/Cheatsheets/git|git]]：排查速查表，含 `log -L`、`log -S` 和 blame 行范围。
- [[zh/Agents/check-build-determinism-before-comparing-bundle-bytes|check-build-determinism-before-comparing-bundle-bytes]]：构建产物在两次运行间来回变，拿它做 bisect 就作废了。
- [[zh/Glossary/bisect|bisect]] · [[zh/Glossary/regression|regression]]

## 改动的引入者

- [[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]]：教训：团队仓库的死代码先保留，除非提清理的人就是引入者，且没有未关闭的 PR 动过那个文件。

## 历史重写与隔离

- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]：把秘密移出纳入跟踪的仓库。
- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]：每个会话独立一份检出。
- [[zh/Glossary/worktree|worktree]]

## 暂存陷阱

- [[zh/Agents/git-add-multi-pathspec-fails-atomically|git-add-multi-pathspec-fails-atomically]]：pathspec 错一条就什么都不暂存，下次 commit 会提交错的文件树。
- [[zh/Agents/env-file-protection-patterns-fire-on-non-secret-operations|env-file-protection-patterns-fire-on-non-secret-operations]]：这个 guard 会让每次走 hook 的 commit 背后的 `lint-staged` 失败。
- [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]：重新生成 OpenAPI 后只提交这次改动能解释的 hunk，生成器的 enum 顺序不固定。
