---
type: glossary
tags: [glossary, infra]
---
# DNS

**Full name**: Domain Name System

Maps a host name to addresses. A name with no record does not resolve: `dig +short <host>` prints nothing and `curl` exits with code 6, `Could not resolve host`. A site can serve the apex (`example.com`) while `www.example.com` has no record at all.

Example usage:
> `www` has no DNS record, so every canonical link built from `SITE_URL` points at a host that does not resolve.

## Related
- [[2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]
- [[site-url-constant-is-not-proof-the-host-resolves]]
