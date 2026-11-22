---
type: glossary
tags: [glossary, auth]
---
# JWT

**全称**：JSON Web Token

自包含的认证 token，由 `header.payload.signature` 三段用 `.` 拼成。`payload` 里的 `exp` 是过期时间戳，客户端本地解码就能看有没有过期，不用问服务端。跟传统 session cookie 比，session cookie 只是个不透明 ID，真实状态存在服务端；JWT 自己带着状态，服务端验个签就能确认是否有效，不用查库。

![JWT 由点号分隔成三段，客户端可读取载荷里的 exp，服务端负责验签。](../Diagrams/jwt.token-parts.svg)

用例：

> TradingView 的 `auth_token` 是 JWT，实际有效期看 `exp` 声明，文档里写的「约 4 小时」只是估算。

## 相关

- [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
