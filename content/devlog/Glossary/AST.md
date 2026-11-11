---
type: glossary
tags: [glossary, tooling]
---
# AST

**Full name**: Abstract Syntax Tree
**Chinese**: 抽象语法树

The tree a parser builds from source code, one node per construct (function, decorator, call). Walking it finds every instance of a construct exactly, where a text grep can miss multi-line forms or match comments.

Usage example:
> Codex enumerated 164 route decorators by AST and found no route missing from the API index.

## Related
- [[search]]
