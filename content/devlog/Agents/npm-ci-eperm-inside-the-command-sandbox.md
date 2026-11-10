---
type: agent-lesson
date: 2026-11-09
tags: [npm, sandbox, claude-code]
---
# Give npm a cache under $TMPDIR inside the command sandbox

**Mistake**: a subagent ran `npm ci` in the portfolio repo inside the Claude Code command sandbox. It exited 255 partway through extraction and left a broken, partial `node_modules`. npm blamed the cache and printed a fix:

```
npm error code EPERM
npm error path /Users/kelsonqu/.npm/_cacache/tmp/***
npm error Your cache folder contains root-owned files, due to a bug in previous versions of npm which has since been addressed.
npm error To permanently fix this problem, please run:
npm error   sudo chown -R 501:20 "/Users/kelsonqu/.npm"
```

**Root cause**: the cache has no root-owned files. The sandbox's write allowlist covers `~/.npm/_logs` but not `~/.npm/_cacache`, so every cache write fails with `EPERM`, and npm reports any `EPERM` there with its root-owned-files message.

**Rule going forward**:
- Inside the sandbox, run `npm ci --cache "$TMPDIR/npm-cache"` (the same flag works for `npm install`). The rerun printed `added 747 packages in 4s`; `npm ci` replaces the broken `node_modules` itself.
- Never run the `sudo chown` npm suggests. It changes nothing about the sandbox and touches ownership outside the task.
- Treat `EPERM` on a path outside the working directory as the sandbox boundary first, before believing the tool's own explanation.

**Source**: [[2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]] (full case, with the investigation timeline).
