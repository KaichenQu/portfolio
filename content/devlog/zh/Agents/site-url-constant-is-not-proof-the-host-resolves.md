---
type: agent-lesson
date: 2026-11-09
tags: [seo, dns, nextjs, deploy]
---
# 发 canonical、Open Graph、sitemap URL 之前先解析域名

**错误**：个人主页的 `SITE_URL` 是 `https://www.kelsonqu.com` ，所有 canonical 链接、`og:url` 、`og:image` 和 sitemap 条目都由它拼出来。三个 PR、两轮 review、185 个测试都过了。测试拿 URL 和这个常量比，当然一致。部署后核对才发现这个域名解析不了：`dig +short www.kelsonqu.com` 什么都没输出，`curl` 退出码 6，`Could not resolve host` 。真正提供站点的是主域 `kelsonqu.com` 。

![测试结果与 SITE_URL 一致，但 www 主机没有 DNS 记录，curl 无法解析。](../Diagrams/site-url-constant-is-not-proof-the-host-resolves.dns-verification.svg)

**根因**：这个常量比这次的工作早，大家把它当成了 DNS 上的事实。构建和测试里没有哪一步会解析域名。会话里第一次 `dig` 在命令沙箱里超时了，之后没人重跑。

**以后的规则**：
- 发 canonical、Open Graph 或 sitemap URL 之前，先解析域名（`dig +short <host>`），再从它取一页（`curl -sS -o /dev/null -w '%{http_code}\n' https://<host>/`）。输出为空或 curl 退出码 6，说明域名不对。
- `dig` 在沙箱里超时，就放开网络重跑；超时不算答案。
- 部署后读线上的 `<link rel="canonical">` ，再取它给出的 `og:image` 地址，应该返回 200。

**来源**：[[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]（完整案例，含排查时间线）。
