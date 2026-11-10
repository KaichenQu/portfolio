---
type: glossary
tags: [glossary]
---
# lint-staged

**Full name**: lint-staged
**Chinese**: 暂存区代码检查

A pre-commit runner that applies formatters and linters only to the files staged for the commit. It stashes unstaged changes first, so it walks the whole worktree; a sandbox that denies reading any path (for example `**/.env*`) makes the stash fail and the commit abort before any check runs.

Usage example:
> The commit failed inside lint-staged with `lstat(".env.example"): Operation not permitted`; rerun it outside the sandbox.

## Related
- [[env-file-protection-patterns-fire-on-non-secret-operations]]
