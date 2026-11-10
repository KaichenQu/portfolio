---
type: trick
date: 2026-06-22
tags: [debug, config]
---
# Config that "looks right" isn't config that's "being read"

When hand-writing a config file, confirm the path and field names the tool actually reads before you confirm the content format. A file can have valid JSON and the right field names but sit at the wrong path — the tool won't error, it will just quietly do nothing. That kind of failure is harder to spot than a format error. Prefer the tool's own `add`/`init`/`register`-style command to generate the config; it knows the correct location for the current version.

```bash
claude mcp add <name> --scope user -- <command>
```

## Related
- [[2026-06-22-tradingview-mcp-not-registering]]
- [[MCP]]
