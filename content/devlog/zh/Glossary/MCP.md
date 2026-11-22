---
type: glossary
tags: [glossary, mcp]
---
# MCP

**全称**：Model Context Protocol

模型上下文协议，让 Claude Code 这类 LLM 客户端接入外部工具和数据源。server 暴露工具和资源，客户端按 local / project / user 范围注册后，对应工具会出现在会话的工具列表。注册位置错了，例如手写到客户端不读的文件里，效果和没配置一样，通常也不报错。

![把 MCP 服务器注册到 Claude Code 读取的范围后，数据源工具会出现在会话工具列表中。](../Diagrams/mcp.registration-flow.svg)

用例：

> 给 Claude Code 接新数据源，归根结底就是注册 MCP server。先用 `claude mcp add`，省得手写配置文件。

## 相关

- [[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
