---
type: agent-lesson
date: 2026-06-22
tags: [mcp, claude-code, config]
---
# 工具配置的实际写入位置

**错误**：手写 `~/.claude/.mcp.json` 注册 MCP server（`tradingview`）。JSON 合法，key 也都对，但 Claude Code 从不从这处路径读全局（用户范围）server。它没报错，server 只是在 `/mcp` 和工具列表里都没出现。

![Claude 从当前账号的 .claude.json 读取 mcpServers，猜测路径下的 .mcp.json 即使有效也可能没被加载。](../Diagrams/mcp-server-config-location.effective-account.svg)

**根因**：全局 MCP 配置在 `CLAUDE_CONFIG_DIR/.claude.json` 顶层的 `mcpServers` 字段，默认文件为 `~/.claude/.claude.json`。手动放在 `~/.claude/` 下的 `.mcp.json` 不参与读取。

**以后的规则**：
- 添加或改全局工具或 agent 配置（MCP server、CLI 集成等）时，优先走工具自带的 `add`、`register` 或 `init`，省得猜路径手写配置。
- 必须手写时，确认工具实际读取了文件（用 `<tool> list`、`<tool> doctor` 或等效命令）再下结论。「看起来没问题」的配置放错路径，失效时往往没动静。
- 多账号或多配置目录并存时（这里 `claude1`、`claude2` alias 指向不同的 `CLAUDE_CONFIG_DIR`），先确认用的命令或 alias 真指向想改的配置，再信它的输出。

**来源**：[[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]（完整案例，含排查时间线）。
