---
type: glossary
tags: [glossary, auth]
---
# JWT

**全称**：JSON Web Token

自包含的认证 token。它由 `header.payload.signature` 三段组成，用 `.` 连接。`payload` 里的 `exp` 是过期时间戳，客户端可以在本地解码判断过期，不用问服务端。传统 session cookie 只是个不透明 ID，实际状态存在服务端。JWT 随 token 带上状态，服务端验签即可确定是否有效，不用查库。

![JWT 由点号分隔成三段，客户端可读取载荷里的 exp，服务端负责验签。](../Diagrams/jwt.token-parts.svg)

用例：

> TradingView 的 `auth_token` 是 JWT，实际能用到什么时候，看 `exp` 声明。文档里的「约 4 小时」只是估算。

## 相关

- [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
