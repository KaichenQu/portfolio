---
type: moc
tags: [moc, git]
---
# Git and history

15 notes. Three threads: finding a change, finding who introduced it, and rewriting or isolating one.

## Finding the change that broke it

- [[locating-regressions-with-git-bisect]] — automated bisection with `git bisect run`
- [[binary-search-fault-localization]] — the general form the bisect technique is an instance of
- [[git]] — the troubleshooting cheatsheet (`log -L`, `log -S`, blame ranges)
- [[check-build-determinism-before-comparing-bundle-bytes]] — a bisect over a build output that alternates between runs is void
- [[bisect]] · [[regression]]

## Who introduced it

- [[multi-agent-dead-code-deletion-needs-repo-wide-grep]] — the lesson: dead code in a team repo is deferred unless the requester introduced it and no open PR touches its file

## Rewriting and isolating

- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] — moving secrets out of a tracked repo
- [[parallel-claude-code-sessions-with-git-worktrees]] — one checkout per session
- [[worktree]]

## Staging traps

- [[git-add-multi-pathspec-fails-atomically]] — one bad pathspec stages nothing, and the next commit ships the wrong tree
- [[env-file-protection-patterns-fire-on-non-secret-operations]] — the guard that breaks `lint-staged` behind every hook-driven commit
- [[regenerated-contract-nondeterministic-enum-order]] — commit only the regenerated OpenAPI hunks your change explains; the generator's enum order is non-deterministic
