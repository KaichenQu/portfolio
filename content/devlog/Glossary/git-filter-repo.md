---
type: glossary
tags: [glossary]
---
# git filter-repo

**Full name**: git-filter-repo
**Chinese**: Git 历史重写工具

The maintained replacement for `git filter-branch`: rewrites a repository's whole history to drop paths, strip secrets, or move directories. Every commit SHA after the rewrite changes, so any SHA cited before it no longer resolves in the rewritten repository.

![After git filter-repo rewrites the fork, pre-fork commit SHAs must be looked up in the upstream history.](../Diagrams/git-filter-repo.rewritten-identities.svg)

Usage example:
> The pre-fork SHAs were rewritten by git filter-repo; cherry-pick from upstream directly, not from this history.

## Related
- [[git]]
