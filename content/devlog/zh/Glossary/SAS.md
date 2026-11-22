---
type: glossary
tags: [glossary]
---
# SAS

**全称**：Shared Access Signature
**中文**：共享访问签名

Azure Storage 把授权放进 URL 查询字符串：`st=`（开始）、`se=`（过期）、`sp=`（权限）和 `sig=`。GitHub Actions 下载产物会重定向到这种链接，有效期 10 分钟。Azure 每次请求都检查签名。窗口内打开的连接过了期限还能继续传，但 `se=` 之后发的新请求会收到 403。

![SAS 查询串含起始、到期、权限与签名字段，在 se= 之后新发请求会被 Azure 拒绝。](../Diagrams/sas.signed-url-window.svg)

用例：

> 续传失败是 SAS 过期了。设计重试前先看 `se=`。

## 相关

- [[zh/Agents/check-signed-url-lifetime-before-designing-resume|check-signed-url-lifetime-before-designing-resume]]
