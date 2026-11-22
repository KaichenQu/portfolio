---
type: glossary
tags: [glossary, infra]
---
# DNS

**全称**：Domain Name System

域名系统，把主机名映射到地址。没记录的名字解析不了：`dig +short <host>` 没输出，`curl` 退出码 6，报 `Could not resolve host`。站点可以在裸域（`example.com`）正常服务，同时 `www.example.com` 根本没有记录。

![根域名与 www 主机分别解析，根域名可用时，指向 www 的规范链接仍可能失败。](../Diagrams/dns.host-resolution.svg)

用例：

> `www` 没配 DNS 记录，用 `SITE_URL` 拼出来的 canonical 链接全指向解析不了的主机名。

## 相关

- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]
- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]
