---
type: glossary
tags: [glossary]
---
# OIDC

**全称**：OpenID Connect
**中文**：开放身份连接

架在 OAuth 2.0 上的身份层。在 CI 里，workflow 向云厂商出示一份短期签名 token，说明自己的 repo、分支和 job，再换取临时凭据，CI secrets 里就不用存长期 access key。GitHub Actions 需要配 `permissions: id-token: write`，Alibaba Cloud RAM 和 AWS IAM 都认 GitHub 签发的身份。

![上传工作流获取 GitHub 签发的 OIDC 令牌，通过 RAM 换取临时凭据，再用于 OSS。](../Diagrams/oidc.credential-exchange.svg)

用例：

> 走 RAM OIDC 上传到 OSS，省得在仓库 secrets 里放 AccessKey。

## 相关

- [[zh/Glossary/CI-CD|CI-CD]]
