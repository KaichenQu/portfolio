---
type: trick
date: 2026-06-22
tags: [debug, config]
---
# 磁盘上的配置与实际生效的配置

手写配置时先确认工具实际读的路径和字段名，再检查内容格式。JSON 可以完全合法，字段也写对了，但文件放错位置，工具既不报错也不做事。这比格式错误更难发现。优先让工具自己的 `add`、`init` 或 `register` 命令生成配置，它知道当前版本的正确位置。

![先核对工具实际读取的路径和字段，就能解释为何有效的手写 MCP JSON 没有生效。](../Diagrams/config-on-disk-is-not-config-in-effect.read-location.svg)

```bash
claude mcp add <name> --scope user -- <command>
```

## 相关

- [[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]
- [[zh/Glossary/MCP|MCP]]
