---
type: glossary
tags: [glossary]
---
# OIDC

**Full name**: OpenID Connect
**Chinese**: 开放身份连接

An identity layer on OAuth 2.0. In CI it means a workflow presents a short-lived signed token about itself (repo, branch, job) to a cloud provider, which exchanges it for temporary credentials, so no long-lived access key is stored in the CI secrets. GitHub Actions needs `permissions: id-token: write`; Alibaba Cloud RAM and AWS IAM both accept the GitHub issuer.

Usage example:
> Upload to OSS through RAM OIDC instead of putting an AccessKey in the repository secrets.

## Related
- [[CI-CD]]
