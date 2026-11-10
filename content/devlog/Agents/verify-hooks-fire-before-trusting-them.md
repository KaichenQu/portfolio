---
type: agent-lesson
date: 2026-07-07
tags: [claude-code, hooks, config]
---
# A hook that silently exits 0 looks identical to a hook that works

**Mistake**: Two custom PreToolUse guard hooks in Claude Code settings.json (block `.env` writes, block `rm -rf /`) read `$CLAUDE_TOOL_INPUT` and had never fired once — the variable is empty, grep misses, exit 0, tool call proceeds. Separately, 9 of 13 claudekit hooks had zero executions ever but still spawned a process on every edit/stop.

**Root cause**: Claude Code delivers hook input as JSON on stdin only; there is no `CLAUDE_TOOL_INPUT` env var. A guard hook has no positive signal: "no match, allow" and "broken, allow" produce the same observable result, so the breakage is invisible until you check execution logs.

**Rule going forward**:
- Hook commands must read stdin JSON (`tool_input.command`, `tool_input.file_path`), never a `CLAUDE_*` env var for tool input.
- After adding or auditing any hook, verify it actually fires: check `~/.claudekit/logs/hook-stats.json` / debug logs, or feed it crafted stdin JSON manually and confirm the deny path triggers.
- Prefer declarative permission rules (`deny: Write(**/.env*)`) over a hook when they can express the same guard — nothing to silently break.

**Source**: [[2026-07-07-unifying-dual-account-claude-config]] (full case, with the investigation timeline).
