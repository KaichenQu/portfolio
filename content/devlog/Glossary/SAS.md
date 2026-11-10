---
type: glossary
tags: [glossary]
---
# SAS

**Full name**: Shared Access Signature
**Chinese**: 共享访问签名

An Azure Storage URL with the authorisation baked into the query string: `st=` (start), `se=` (expiry), `sp=` (permissions) and `sig=`. GitHub Actions artifact downloads redirect to one, valid for 10 minutes. Azure checks it per request, so a connection opened inside the window keeps streaming after it, but any new request after `se=` gets 403.

Usage example:
> The resume failed because the SAS had expired; read `se=` before designing a retry.

## Related
- [[check-signed-url-lifetime-before-designing-resume]]
