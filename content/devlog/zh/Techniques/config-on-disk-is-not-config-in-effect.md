---
type: trick
date: 2026-06-22
tags: [debug, config]
---
# 磁盘上的配置与实际生效的配置

手写配置时先核对工具实际读的路径和字段名，再去查内容格式。JSON 合法、字段名也对，但文件放错了路径，工具既不报错也不生效，比格式错更难排查。优先用工具自带的 `add`、`init`、`register` 命令生成配置，它知道当前版本该写在哪里。

![先核对工具实际读取的路径和字段，就能解释为何有效的手写 MCP JSON 没有生效。](../Diagrams/config-on-disk-is-not-config-in-effect.read-location.svg)

```bash
claude mcp add <name> --scope user -- <command>
```

## 相关

- [[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]
- [[zh/Glossary/MCP|MCP]]
