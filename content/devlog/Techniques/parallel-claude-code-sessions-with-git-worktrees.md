---
type: pattern
date: 2026-07-22
tags: [pattern, git, claude-code, workflow]
---
# Parallel Claude Code sessions with git worktrees

## When to use

You want to work on two branches of the same repo at the same time — for example, two terminals in VS Code, each running its own Claude Code session in parallel. Doing this directly in one directory doesn't work: ==a single working directory can only have one branch checked out at a time==, so both terminals see the same files, and a `git checkout` in one terminal yanks the other one's working state out from under it.

## How

**1. One [[worktree]] per branch** (shares the same `.git`, no second clone needed):

```bash
git worktree add ../<repo>-b2 <branch-2>   # new directory, checks out the other branch
```

Each terminal stays in its own directory and runs `claude`, with no interference between them. Clean up when done:

```bash
git worktree remove ../<repo>-b2
git worktree list                          # list current worktrees
```

**2. To run two accounts at the same time, isolate them with `CLAUDE_CONFIG_DIR`** (already set up on this machine, see source case):

```bash
alias claude1='CLAUDE_CONFIG_DIR=~/.claude claude'
alias claude2='CLAUDE_CONFIG_DIR=~/.claude-account2 claude'
```

The first time `claude2` runs, it goes through the normal browser login and stores its token in a separate directory. After that, run `claude1` in one terminal and `claude2` in another — auth, settings, and session history are fully isolated, with no need to log out and switch.

## Why it works

- Worktrees let multiple working directories share one `.git` database: branches, stashes, and config exist only once, but each directory has its own checkout and index, so isolation happens naturally at the file level.
- Claude Code's login state and config all live in the config directory; wherever `CLAUDE_CONFIG_DIR` points is what gets used. So two processes pointed at two directories are two independent accounts — this is an officially supported mechanism, not a hack.

## Caveats / counterexamples

- The same branch can't be checked out by two worktrees at once; git refuses outright.
- Ignored build artifacts like `node_modules` aren't shared; a new worktree needs its own `pnpm install`.
- Running dev servers on both sides at once fights over ports (e.g. 5173); change the port on one side or only run one.
- Running two accounts assumes the config doesn't drift; share content via symlinks — see source case.
- If you just want parallelism and aren't short on quota, one account with two sessions is enough — the second account exists to double the quota.

## Source cases

- [[2026-07-07-unifying-dual-account-claude-config]] — origin of the claude1/claude2 aliases and `CLAUDE_CONFIG_DIR` isolation
- 2026-07-22 session: research done for parallel edits on a temporary demo branch; matches the common community approach (worktree + config dir isolation)
