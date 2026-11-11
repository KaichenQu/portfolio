---
type: moc
tags: [moc, claude-code, multi-agent, context-engineering, hooks, mcp, llm]
---
# Agentic engineering

24 notes. Cross-cuts `Cases/`, `Techniques/`, `Agents/`, `Glossary/`.

## Declared config vs config in effect

The single most repeated root cause here. Four notes, four different layers, same shape.

- [[mcp-server-config-location]] — global MCP config lives in `CLAUDE_CONFIG_DIR/.claude.json`, not a hand-written `.mcp.json`
- [[2026-06-22-tradingview-mcp-not-registering]] — server configured, absent from `/mcp`
- [[2026-07-25-subagents-disabled-by-stale-subscription-cache]] — every local file correct, the cached subscription tier was stale
- [[config-on-disk-is-not-config-in-effect]] — the habit that catches all three

## Hooks and guards

A guard that is too broad and a guard that silently does nothing fail identically from the outside.

- [[verify-hooks-fire-before-trusting-them]] — a hook exiting 0 without running looks like a hook that works
- [[widening-a-hook-matcher-revisits-every-rule]] — widening a matcher changes what every existing rule means
- [[env-file-protection-patterns-fire-on-non-secret-operations]] — name matching, not access intent
- [[check-hook-logs-when-an-agent-claims-no-permission]] — read the guard's log, not the agent's paraphrase
- [[npm-ci-eperm-inside-the-command-sandbox]] — npm blames root-owned files for a sandbox write denial; give it a cache under `$TMPDIR`

## Context engineering

- [[2026-07-25-trimming-claude-md-and-splitting-agents-index]] — splitting an always-loaded file into entry point and index
- [[trimming-config-files-needs-a-sole-copy-check]] — deleting text and dropping an `@import` look identical in a diff
- [[2026-07-07-unifying-dual-account-claude-config]] — two accounts, one config tree, dead hooks removed

## Multi-agent work

- [[2026-07-10-quiet-desk-redesign-four-parallel-agents]] — four agents split by file ownership, and the boundary that leaked
- [[multi-agent-dead-code-deletion-needs-repo-wide-grep]] — the lesson that came out of it
- [[parallel-claude-code-sessions-with-git-worktrees]] — the isolation mechanism

## Guardrails that live in the server, not the prompt

- [[post-edit-formatter-drops-an-import-added-before-its-use]] — the hook that turned a two-step edit into a `NameError`

## LLM proxies

- [[2026-06-25-newapi-model-listed-but-unusable]] — listed is not usable
- [[verifying-an-llm-proxy-serves-the-real-model]] — the response-shape decision tree from that case
- [[MCP]] · [[newapi]]
