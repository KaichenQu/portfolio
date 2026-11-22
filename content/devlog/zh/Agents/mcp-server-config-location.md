---
type: agent-lesson
date: 2026-06-22
tags: [mcp, claude-code, config]
---
# 工具配置的实际写入位置

**错误**：手写 `~/.claude/.mcp.json` 注册 MCP server（`tradingview`）。JSON 合法，key 也全对，但 Claude Code 根本不从这个路径读全局（用户范围）server。它不报错，只是 `/mcp` 和工具列表里都没出现这个条目。

![Claude 从当前账号的 .claude.json 读取 mcpServers，猜测路径下的 .mcp.json 即使有效也可能没被加载。](../Diagrams/mcp-server-config-location.effective-account.svg)

**根因**：全局 MCP 配置在 `CLAUDE_CONFIG_DIR/.claude.json` 顶层的 `mcpServers` 字段，默认是 `~/.claude/.claude.json`。手放在 `~/.claude/` 下的 `.mcp.json` 不在读取路径上。

**以后的规则**：
- 增改全局工具或 agent 配置（MCP server、CLI 集成等），优先用工具自带的 `add`、`register`、`init`，别靠猜路径手写文件。
- 必须手写时，用 `<tool> list`、`<tool> doctor` 之类命令确认工具真读到了，再算完事。看着没毛病的配置放错地方，失效时往往毫无报错。
- 多账号或多配置目录并存时（如 `claude1`、`claude2` alias 指向不同 `CLAUDE_CONFIG_DIR`），先确认用的命令或 alias 确实指向想改的那套配置，再信它的输出。

**来源**：[[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]（完整案例，含排查时间线）。
