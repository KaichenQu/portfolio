---
type: glossary
tags: [glossary, tooling]
---
# AST

**全称**：Abstract Syntax Tree
**中文**：抽象语法树

解析器从源码建出来的树，函数、装饰器、调用这些语法结构各占 1 个节点。遍历这棵树能精确找出某类结构的所有实例，而直接用 grep 搜文本容易漏掉跨行写法，或把注释也匹进去。

![AST 审查按语法节点统计出 164 个路由装饰器，确认 API 索引没有遗漏。](../Diagrams/ast.syntax-query.svg)

用例：

> Codex 用 AST 枚举了 164 个路由装饰器，API 索引里一条都没漏。

## 相关

- [[zh/Cheatsheets/search|search]]
