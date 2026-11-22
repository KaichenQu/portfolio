---
type: glossary
tags: [glossary, frontend]
---
# DOM

**全称**：Document Object Model
**中文**：文档对象模型

浏览器里反映页面当前元素和属性的树。把 DOM 序列化成快照，就能记录页面实际渲染出来的结构。前后快照做 diff，搭配截图比对，可以抓到像素没变却改了结构的问题。

![清理审查将 60 份 DOM 快照与 60 张截图一同比对，既核对结构也核对像素。](../Diagrams/dom.structure-snapshots.svg)

用例：

> 30 个页面各测两种宽度，得到 60 张 PNG 和 60 份 DOM 快照，拿来比对清理前后的结果。

## 相关

- [[zh/Glossary/Playwright|Playwright]]
