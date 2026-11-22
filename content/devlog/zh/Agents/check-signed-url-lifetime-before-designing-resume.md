---
type: agent-lesson
date: 2026-09-03
tags: [network, ci-cd, deploy]
publish: true
---
# 签名 URL 的有效期与下载重试

**错误**：部署服务器下 96 MB 产物时撞上 15 分钟时限。第一次修复（PR ▒▒▒▒）加了按区间续传，把时限拉到 40 分钟；测试、引导部署、合并全做完了，下一次部署照样失败：第 12 分钟触发续传，服务端直接拒绝了新请求。

![已经打开的 Azure SAS 下载流可以跨过十分钟有效期，但第 12 分钟发起的新请求收到 HTTP 403。](../Diagrams/check-signed-url-lifetime-before-designing-resume.request-expiry.svg)

**根因**：GitHub 产物下载 URL 是 10 分钟有效的 Azure [[zh/Glossary/SAS|SAS]] 链接（从 `st=` 到 `se=`）。Azure 每次请求都验签：已打开的流能继续跑，过期后重连一律返回 403。续传和拉长时限都没碰到真正起限制作用的约束。对产物端点跑一遍 `curl -I`，原本就能看到 `se=` 只比 `st=` 晚 10 分钟。

**以后的规则**：
- 给预签名 URL 设计重试、续传或调整超时前，先拿一条真实 URL 看清有效窗口。设计目标应是「在窗口内下完」，不是「撑更久」。
- 续传照旧留着，兜住窗口内的断连；文档里写明过期后续传会直接拒绝。
