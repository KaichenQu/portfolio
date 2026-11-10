---
type: glossary
tags: [glossary, git]
---
# worktree

**Full name**: git worktree (linked working tree)

Lets one repo have multiple working directories at once, each checked out to a different branch, all sharing the same `.git` database (a single copy of branches, stashes, config). Saves space over cloning again, and avoids checking out back and forth between branches. Limitation: the same branch can't be checked out in two worktrees at once.

```bash
git worktree add <path> <branch>
git worktree list
git worktree remove <path>
```

Example usage:
> Keep the main directory on `main`, open a worktree to fix a hotfix — neither disturbs the other.

## Related

- [[parallel-claude-code-sessions-with-git-worktrees]]
- [[bisect]]
