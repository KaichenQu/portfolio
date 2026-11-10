---
type: agent-lesson
date: 2026-06-22
tags: [mcp, claude-code, config]
---
# Locate config via the tool's own command, not by guessing the path

**Mistake**: registered a new MCP server (`tradingview`) by hand-writing
`~/.claude/.mcp.json`. The file was valid JSON with the right keys, but
Claude Code never reads that path for global (user-scope) servers. No error
was raised — the server simply never appeared in `/mcp` or the tool list.

**Root cause**: global MCP config lives in the top-level `mcpServers` field
of `CLAUDE_CONFIG_DIR/.claude.json` (default `~/.claude/.claude.json`), not
in a `.mcp.json` file placed manually under `~/.claude/`.

**Rule going forward**:
- When adding or changing a global tool/agent config (MCP servers, CLI
  integrations, etc.), prefer the tool's own `add`/`register`/`init` command
  over hand-writing a config file at a guessed path.
- If a hand-written file is unavoidable, verify it is actually read (`<tool>
  list`, `<tool> doctor`, or equivalent) before assuming it worked — a config
  that "looks right" but sits in the wrong path fails silently.
- In multi-account/multi-config-dir setups (here: `claude1`/`claude2`
  aliases pointing at different `CLAUDE_CONFIG_DIR`), confirm which
  command/alias actually targets the config you intend to change before
  trusting its output.

**Source**: [[2026-06-22-tradingview-mcp-not-registering]] (full case, with the investigation
timeline).
