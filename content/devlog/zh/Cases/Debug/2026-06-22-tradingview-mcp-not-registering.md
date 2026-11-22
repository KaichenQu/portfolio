---
type: case-debug
date: 2026-06-22
tags: [debug, mcp, claude-code]
status: solved
---
# 配了 tradingview MCP，`/mcp` 却找不到

要把本地的 tradingview MCP server（`~/mcp-servers/tradingview-mcp`）接进 Claude Code。手动写好 `~/.claude/.mcp.json` 重启会话后，`/mcp` 列了 6 个 server，包含几个 claude.ai 连接器和 `claude_design`、`computer-use`，唯独没有 `tradingview`。

![手写文件里的 TradingView MCP 条目未被读取，用户范围注册写入当前账号配置后，服务器才出现在列表里。](../../Diagrams/2026-06-22-tradingview-mcp-not-registering.config-read-path.svg)

## 现象

`/mcp` 面板能打开，内置的 `claude_design` 和 `computer-use` 都正常显示。新加的 `tradingview` 不在列表里，也没报错。

## 复现

往 `~/.claude/.mcp.json` 写入 `mcpServers.tradingview`，重启 Claude Code，打开 `/mcp`，每次都看不到这个条目。

## 排查过程

1. 先排除配置文件写错。`cat ~/.claude/.mcp.json` 看下来 JSON 合法，`mcpServers.tradingview` 完整，`command` 和 `args` 都对。**JSON 没问题，毛病在别处。**

2. 怀疑 Claude Code 根本不从这个路径读全局 MCP 配置。查一下 `~/.claude.json` 顶层有没有 `mcpServers`：
   ```bash
   python3 -c "
   import json
   d = json.load(open('/Users/kelsonqu/.claude.json'))
   print('mcpServers' in d, d.get('mcpServers'))
   "
   ```

   输出 `False None`，顶层没有这个 key。再跑 `grep -o '"mcpServers"[^}]*}' ~/.claude.json`，搜出一堆 `"mcpServers": {}`，全散在各个项目条目里，都是空对象。**全局 MCP 配置另有位置，Claude Code 根本不读 `~/.claude/.mcp.json`。**

3. 用官方命令确认，不再猜路径。先试 `claude mcp list`，没跑通，这个 shell 里把 `claude` 设成了提示用的别名：
   ```
   claude is an alias for echo 'Use: claude1 or claude2'
   ```

   `claude1` 和 `claude2` 分别对应 `CLAUDE_CONFIG_DIR=~/.claude` 和 `~/.claude-account2`，代表两个账号。改跑 `claude1 mcp list`：
   ```
   claude.ai Robinhood: ... ! Needs authentication
   claude.ai Google Drive: ... ! Needs authentication
   claude.ai Gmail: ... ! Needs authentication
   claude.ai Google Calendar: ... ! Needs authentication
   claude_design: ... ✔ Connected
   ```

   还是没有 `tradingview`，印证了第 2 步：server 根本没注册上，手写配置完全没生效。

4. 走官方入口，用 `claude1 mcp add` 注册：
   ```bash
   claude1 mcp add tradingview --scope user -- node /Users/kelsonqu/mcp-servers/tradingview-mcp/src/server.js
   ```

   输出 `File modified: /Users/kelsonqu/.claude/.claude.json`。正确位置是 `CLAUDE_CONFIG_DIR` 下的 `.claude.json`，不是 `.mcp.json`。再跑 `claude1 mcp list`，显示 `tradingview: node ... - ✔ Connected`。

## 根因

==Claude Code 把全局（用户范围）的 MCP server 配置放在 `CLAUDE_CONFIG_DIR/.claude.json` 顶层的 `mcpServers` 字段，`~/.claude/.mcp.json` 不在读取路径上。== 手写文件放错了位置，程序既不读也不报错，跟没配一样，所以 `/mcp` 和工具列表里都不会出现新条目。

## 修复

- 用 `claude1 mcp add tradingview --scope user -- node /Users/kelsonqu/mcp-servers/tradingview-mcp/src/server.js` 重新注册，让 CLI 写到正确的 `~/.claude/.claude.json`。
- 删掉无效的 `~/.claude/.mcp.json`，免得以后误以为还在生效。
- 注册完重启会话，新工具只会在新会话里加载进工具列表。

## 经验

- **增改全局工具配置，优先用工具自带的 `add` 或 `register` 命令，别靠猜路径手写文件。** 命令清楚当前版本和作用域该写哪个文件、哪个字段。手写到猜出来的路径，很容易看着没毛病，程序却根本不读，通常还不报错。见 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- **多账号或多个 `CLAUDE_CONFIG_DIR` 并存时，先确认 CLI 实际指向哪套配置。** 这里 `claude` 只是提示别名，能用的是 `claude1` 和 `claude2`。默认用 `claude`，第一步就会卡住。
- 排查「配置写了却没生效」，思路跟 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 一样：先排除文件格式有错，再排除读取路径不对，逐步缩小范围，别反复改文件内容碰运气。

## 相关

- [[zh/Glossary/MCP|MCP]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
