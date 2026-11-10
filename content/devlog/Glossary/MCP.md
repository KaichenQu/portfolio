---
type: glossary
tags: [glossary, mcp]
---
# MCP

**Full name**: Model Context Protocol

A standard protocol that lets an LLM client (e.g. Claude Code) plug in external tools and data sources. The server side exposes tools/resources; once the client side registers them (by scope: local / project / user), the corresponding tools show up in the session's tool list. Registering at the wrong location — e.g. hand-writing it into a file path the client doesn't read — behaves exactly like no configuration at all, usually with no error.

Example usage:
> Wiring a new data source into Claude Code is, at bottom, registering an MCP server — prefer `claude mcp add` over hand-writing a config file.

## Related
- [[2026-06-22-tradingview-mcp-not-registering]]
- [[config-on-disk-is-not-config-in-effect]]
