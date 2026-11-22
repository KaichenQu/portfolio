---
type: glossary
tags: [glossary, frontend]
---
# DOM

**全称**：Document Object Model
**中文**：文档对象模型

浏览器里反映页面当前元素和属性的树。把 DOM 序列化成快照，就能记下页面实际渲染出来的结构；前后两份快照做 diff，配着截图一起看，能抓到像素没变、结构却变了的问题。

![清理审查将 60 份 DOM 快照与 60 张截图一同比对，既核对结构也核对像素。](../Diagrams/dom.structure-snapshots.svg)

用例：

> 30 个页面各测两种宽度，拿到 60 张 PNG 和 60 份 DOM 快照，拿来比对清理前后的变化。

## 相关

- [[zh/Glossary/Playwright|Playwright]]
