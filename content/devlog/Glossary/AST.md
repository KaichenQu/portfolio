---
type: glossary
tags: [glossary, tooling]
---
# AST

**Full name**: Abstract Syntax Tree
**Chinese**: 抽象语法树

The tree a parser builds from source code, one node per construct (function, decorator, call). Walking it finds every instance of a construct exactly, where a text grep can miss multi-line forms or match comments.

![The AST audit counted 164 route decorators as syntax nodes and found no missing entry in the API index.](../Diagrams/ast.syntax-query.svg)

Usage example:
> Codex enumerated 164 route decorators by AST and found no route missing from the API index.

## Related
- [[search]]
