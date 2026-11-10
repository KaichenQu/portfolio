---
type: agent-lesson
date: 2026-07-08
tags: [shell, grep]
---
# Anchored regex against `ls` output silently drops entries when the listing appends a trailing slash

**Mistake**: ran `ls <dir> | grep -iE "^default$|^profile"` to find Chrome profile folders. Got back only one line (`Profile 3/`), concluded that was the only/active profile, and built two more rounds of debugging on that wrong premise.

**Root cause**: this environment's `ls` appends a trailing `/` to directory names (like `eza`/`lsd`). `^default$` anchors to end-of-line, so `Default/` never matches — it was silently filtered out with zero indication anything was dropped. `^profile` (no `$`) still matched `Profile 3/`, so the output looked complete and plausible.

**Rule going forward**:
- Never anchor a regex to `$` against `ls`/`find`/tool output without first checking whether that tool appends a suffix (trailing slash, permission prefix, color codes). Drop the `$` anchor unless you've confirmed the exact line format.
- When a filtered command returns fewer results than expected (especially exactly one, or zero), re-run the same query with the filter removed before trusting the result — a silent filter bug looks identical to "there's only one item" or "there's nothing here."
- Prefer machine-readable output flags over piping into `grep` when available (e.g. a tool's own `--json` or `-1` flag) — regex-over-formatted-text is exactly where trailing decorations bite.

**Source**: [[2026-07-08-tradingview-auth-token-no-longer-a-cookie]] (full case, with the investigation timeline).
