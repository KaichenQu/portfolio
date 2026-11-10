---
type: case-debug
date: 2026-06-22
tags: [debug, mcp, claude-code]
status: solved
---
# tradingview MCP server configured but absent from /mcp

Wiring a local tradingview MCP server (`~/mcp-servers/tradingview-mcp`) into Claude Code. The config went into `~/.claude/.mcp.json` by hand; after restarting the session, `/mcp` listed six servers — several claude.ai connectors plus `claude_design` and `computer-use` — and no `tradingview`.

## Symptom
The `/mcp` panel opens, the built-in `claude_design` and `computer-use` both display normally, and the newly added `tradingview` simply does not appear. No error. Just absent.

## Reproduction
Write the `mcpServers.tradingview` config into `~/.claude/.mcp.json`, restart Claude Code, open `/mcp` — the entry is missing, every time.

## Investigation timeline

1. Rule out the config file itself. `cat ~/.claude/.mcp.json` shows valid JSON with a complete `mcpServers.tradingview` entry; `command` and `args` are both correct. **So the JSON is not malformed and the problem lies elsewhere.**

2. Shift the suspicion: maybe this path is not where Claude Code reads global MCP config at all. Check whether `~/.claude.json` has a top-level `mcpServers` field:
   ```bash
   python3 -c "
   import json
   d = json.load(open('/Users/kelsonqu/.claude.json'))
   print('mcpServers' in d, d.get('mcpServers'))
   "
   ```
   Output: `False None` — no such key at the top level. Then `grep -o '"mcpServers"[^}]*}' ~/.claude.json` turns up a pile of `"mcpServers": {}`, all empty, scattered under individual project entries. **Global MCP config lives somewhere else, and Claude Code never reads `~/.claude/.mcp.json` at all.**

3. Confirm with the official command rather than guessing at file locations. `claude mcp list` fails, because in this shell `claude` is aliased to a reminder:
   ```
   claude is an alias for echo 'Use: claude1 or claude2'
   ```
   `claude1` and `claude2` correspond to `CLAUDE_CONFIG_DIR=~/.claude` and `~/.claude-account2`, two separate accounts. Switching to `claude1 mcp list`:
   ```
   claude.ai Robinhood: ... ! Needs authentication
   claude.ai Google Drive: ... ! Needs authentication
   claude.ai Gmail: ... ! Needs authentication
   claude.ai Google Calendar: ... ! Needs authentication
   claude_design: ... ✔ Connected
   ```
   No `tradingview`, which confirms step 2: the server was never actually registered, and the hand-written config file did nothing at all.

4. Register through the official path with `claude1 mcp add`:
   ```bash
   claude1 mcp add tradingview --scope user -- node /Users/kelsonqu/mcp-servers/tradingview-mcp/src/server.js
   ```
   Output: `File modified: /Users/kelsonqu/.claude/.claude.json` — that is the correct target, `.claude.json` under `CLAUDE_CONFIG_DIR`, not `.mcp.json`. `claude1 mcp list` now shows `tradingview: node ... - ✔ Connected`.

## Root cause
==Claude Code stores global (user-scope) MCP server config in the top-level `mcpServers` field of `CLAUDE_CONFIG_DIR/.claude.json`, not at `~/.claude/.mcp.json`.== A file hand-written to the wrong path raises no error and is never read, which is indistinguishable from having configured nothing, so neither `/mcp` nor the tool list gains anything.

## Fix
- Re-register with `claude1 mcp add tradingview --scope user -- node /Users/kelsonqu/mcp-servers/tradingview-mcp/src/server.js` and let the CLI write to the correct `~/.claude/.claude.json`.
- Delete the dead `~/.claude/.mcp.json` so it does not look load-bearing later.
- Restart the session after registering; the new tools only load into a fresh session's tool list.

## Lessons
- **When adding or changing global tool config, reach for the tool's own `add`/`register` command instead of hand-writing a config file at a guessed path.** The command knows which file and which field the current version and current scope actually use. Hand-written config very easily looks right and is never read, and that failure mode usually arrives with no error message whatsoever. See [[config-on-disk-is-not-config-in-effect]].
- **With multiple accounts or multiple `CLAUDE_CONFIG_DIR`s, first check which config the CLI itself points at.** Here `claude` is aliased to a reminder message and the usable binaries are `claude1` and `claude2`; assuming `claude` works strands you at step one.
- "Config written but not in effect" investigations take the same shape as [[binary-search-fault-localization]]: falsify "the file is malformed", then falsify "the read path is wrong", narrowing step by step instead of editing the file contents and retrying.

## Related
- [[MCP]]
- [[config-on-disk-is-not-config-in-effect]]
- [[binary-search-fault-localization]]
- [[systematic-troubleshooting]]
