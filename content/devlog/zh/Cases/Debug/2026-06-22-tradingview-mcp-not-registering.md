---
type: case-debug
date: 2026-06-22
tags: [debug, mcp, claude-code]
status: solved
---
# 配了 tradingview MCP，`/mcp` 却找不到

要把本地的 tradingview MCP server（`~/mcp-servers/tradingview-mcp`）接进 Claude Code。手动写好 `~/.claude/.mcp.json` 后重启会话，`/mcp` 列了 6 个 server，包括几个 claude.ai 连接器以及 `claude_design`、`computer-use`，唯独没有 `tradingview`。

![手写文件里的 TradingView MCP 条目未被读取，用户范围注册写入当前账号配置后，服务器才出现在列表里。](../../Diagrams/2026-06-22-tradingview-mcp-not-registering.config-read-path.svg)

## 现象

`/mcp` 面板能打开，内置的 `claude_design` 和 `computer-use` 都正常显示。新加的 `tradingview` 没出现，也没报错。

## 复现

在 `~/.claude/.mcp.json` 里写入 `mcpServers.tradingview`，重启 Claude Code，再打开 `/mcp`，每次都看不到这个条目。

## 排查过程

1. 先排除配置内容有误。`cat ~/.claude/.mcp.json` 显示 JSON 合法，`mcpServers.tradingview` 齐全，`command` 和 `args` 也没写错。**JSON 本身没问题，往别处查。**

2. 转而怀疑 Claude Code 根本不从这个路径读全局 MCP 配置。看看 `~/.claude.json` 顶层有没有 `mcpServers`：
   ```bash
   python3 -c "
   import json
   d = json.load(open('/Users/kelsonqu/.claude.json'))
   print('mcpServers' in d, d.get('mcpServers'))
   "
   ```

   输出 `False None`，顶层没有这个 key。接着跑 `grep -o '"mcpServers"[^}]*}' ~/.claude.json`，找到一堆 `"mcpServers": {}`，全是散在各项目条目里的空对象。**全局 MCP 配置另有位置，Claude Code 压根不读 `~/.claude/.mcp.json`。**

3. 用官方命令确认，省得继续猜路径。`claude mcp list` 跑不通，因为在这个 shell 里，`claude` 是用来显示提示的别名：
   ```
   claude is an alias for echo 'Use: claude1 or claude2'
   ```

   `claude1` 和 `claude2` 分别对应 `CLAUDE_CONFIG_DIR=~/.claude` 和 `~/.claude-account2`，属于两个账号。换成 `claude1 mcp list`：
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

   输出 `File modified: /Users/kelsonqu/.claude/.claude.json`。正确的目标是 `CLAUDE_CONFIG_DIR` 下的 `.claude.json`，和 `.mcp.json` 是两回事。现在 `claude1 mcp list` 显示 `tradingview: node ... - ✔ Connected`。

## 根因

==Claude Code 把全局（用户范围）的 MCP server 配置放在 `CLAUDE_CONFIG_DIR/.claude.json` 顶层的 `mcpServers` 字段；`~/.claude/.mcp.json` 不在读取路径上。== 手写文件放错了位置，程序既不读它也不报错，效果等于没配，所以 `/mcp` 和工具列表都没有新条目。

## 修复

- 用 `claude1 mcp add tradingview --scope user -- node /Users/kelsonqu/mcp-servers/tradingview-mcp/src/server.js` 重新注册，让 CLI 写到正确的 `~/.claude/.claude.json`。
- 删掉无效的 `~/.claude/.mcp.json`，免得以后误以为还在用。
- 注册完重启会话，新工具只会加载到新会话的工具列表。

## 经验

- **加全局工具配置或改配置，先找工具自己的 `add` 或 `register` 命令。** 命令知道当前版本和范围该用什么文件、什么字段。手写到猜出来的路径，很容易看着都对，程序却压根不读，通常也没有任何报错。见 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- **多账号或多个 `CLAUDE_CONFIG_DIR` 并存时，先查 CLI 实际指向哪个配置。** 这里 `claude` 只是用来提醒的别名，能用的是 `claude1` 和 `claude2`。想当然用 `claude`，第一步就会卡住。
- 排查「配置写了却没生效」，可以按 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 的思路，先排除文件格式有误，再排除读取路径错了，逐步缩小范围，别反复改文件里的内容试运气。

## 相关

- [[zh/Glossary/MCP|MCP]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
