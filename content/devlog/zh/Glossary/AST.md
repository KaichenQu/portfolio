---
type: glossary
tags: [glossary, tooling]
---
# AST

**全称**：Abstract Syntax Tree
**中文**：抽象语法树

解析器从源码构建的树。函数、装饰器、调用等每个语法结构各对应 1 个节点。遍历这棵树能准确找到某类结构的所有实例，直接用 grep 搜文字则可能漏掉跨行写法，或误匹配注释。

![AST 审查按语法节点统计出 164 个路由装饰器，确认 API 索引没有遗漏。](../Diagrams/ast.syntax-query.svg)

用例：

> Codex 用 AST 枚举了 164 个路由装饰器，API 索引没有漏掉任何路由。

## 相关

- [[zh/Cheatsheets/search|search]]
