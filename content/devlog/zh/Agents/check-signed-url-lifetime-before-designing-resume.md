---
type: agent-lesson
date: 2026-09-03
tags: [network, ci-cd, deploy]
publish: true
---
# 签名 URL 的有效期与下载重试

**错误**：部署服务器下载 96 MB 的产物时撞到 15 分钟的期限。首次修复（PR ▒▒▒▒）加了按范围续传，并把期限拉到 40 分钟。测试、引导部署和合并都完成了，下次部署仍失败。第 12 分钟触发续传，新请求遭拒。

![已经打开的 Azure SAS 下载流可以跨过十分钟有效期，但第 12 分钟发起的新请求收到 HTTP 403。](../Diagrams/check-signed-url-lifetime-before-designing-resume.request-expiry.svg)

**根因**：GitHub 产物下载 URL 是 10 分钟有效的 Azure [[zh/Glossary/SAS|SAS]] 链接（从 `st=` 到 `se=`）。Azure 每次请求都验签。已有数据流可以继续，过期后的重连都会收到 403。续传和更长的期限解决的都不是卡住下载的约束。对产物端点跑一遍 `curl -I`，就会看到 `se=` 比 `st=` 晚 10 分钟。

**以后的规则**：
- 要给预签名 URL 加重试、续传，或调整超时，先取到实际 URL，读它的有效窗口。设计目标是「在窗口内下完」，延长期限解决不了过期。
- 保留续传，兜住窗口内的中断。文档写清楚，过期后续传会直接拒绝。
