---
type: glossary
tags: [glossary, frontend]
---
# SPA

**全称**：Single-Page Application

单页应用。浏览器只加载 1 份 HTML/JS，切换页面靠客户端路由和局部渲染，不整页刷新，也不用重新向服务端要渲染好的页面。对应的是传统多页应用（每次导航都由服务端发新 HTML）或 SSR 框架。

![客户端路由切换 React 视图，首次加载的 HTML 和 JavaScript 外壳仍留在浏览器中。](../Diagrams/spa.client-navigation.svg)

用例：

> 这是 React SPA，没有 SSR，页面切换全在客户端完成。

## 相关

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
