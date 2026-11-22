---
type: agent-lesson
date: 2026-11-09
tags: [seo, dns, nextjs, deploy]
---
# 发 canonical、Open Graph、sitemap URL 之前先解析域名

**错误**：个人主页的 `SITE_URL` 写的是 `https://www.kelsonqu.com`，所有 canonical 链接、`og:url`、`og:image` 和 sitemap 条目都从它拼出来。三个 PR、两轮 review、185 个测试都过了；测试拿 URL 跟这个常量比，自然一致。部署后核对才发现这域名解析不了：`dig +short www.kelsonqu.com` 什么都没输出，`curl` 退出码 6，报 `Could not resolve host`。真正提供站点的是主域 `kelsonqu.com`。

![测试结果与 SITE_URL 一致，但 www 主机没有 DNS 记录，curl 无法解析。](../Diagrams/site-url-constant-is-not-proof-the-host-resolves.dns-verification.svg)

**根因**：这个常量在这项工作之前就存在，大家直接把它当成 DNS 现状。构建和测试里没有任何一步会解析域名。会话里第一次跑 `dig` 在命令沙箱里超时了，后面也没人重跑。

**以后的规则**：
- 发 canonical、Open Graph 或 sitemap URL 之前，先查解析（`dig +short <host>`），再从它抓一页（`curl -sS -o /dev/null -w '%{http_code}\n' https://<host>/`）。输出为空或 curl 退出码 6，说明域名不对。
- `dig` 在沙箱里超时，就放开网络重跑；超时不算结论。
- 部署后读线上的 `<link rel="canonical">`，再把里面的 `og:image` 地址拉一遍，确认返回 200。

**来源**：[[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]（完整案例，含排查时间线）。
