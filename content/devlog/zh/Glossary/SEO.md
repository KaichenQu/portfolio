---
type: glossary
tags: [glossary, frontend]
---
# SEO

**全称**：Search Engine Optimization

搜索引擎优化，让搜索引擎容易找到、索引和展示页面。对 Next.js 站点来说主要是元数据：每页的 `<title>` 和 canonical 链接、分享卡片用的 Open Graph 标签、JSON-LD 以及 sitemap。这些都带绝对 URL，能不能用取决于拼 URL 的主机名。

![笔记中的 SEO 改动为每个路由生成元数据、Open Graph 图片和站点地图，它们都依赖配置中的主机。](../Diagrams/seo.metadata-host.svg)

用例：

> SEO 的 PR 为每条路由加了元数据，生成了 Open Graph 图，也加了覆盖全部笔记的 sitemap。

## 相关

- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]
- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]
- [[zh/Glossary/DNS|DNS]]
