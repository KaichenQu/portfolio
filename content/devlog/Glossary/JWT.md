---
type: glossary
tags: [glossary, auth]
---
# JWT

**Full name**: JSON Web Token

A self-contained authentication token: three segments — `header.payload.signature` — joined by `.`. The `exp` field in the `payload` is the expiration timestamp, so a client can decode it locally to check expiry without asking the server. Versus a traditional session cookie: a session cookie is just an opaque ID with the real state kept server-side, while a JWT carries its own state — the server confirms validity by verifying the signature, not by querying a database.

Example usage:
> TradingView's `auth_token` is a JWT — its real lifetime is whatever the `exp` claim says, not the "~4 hours" the docs estimate.

## Related
- [[2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
