---
type: glossary
tags: [glossary]
---
# SSH

**全称**：Secure Shell
**中文**：安全外壳协议

提供加密的远程登录和命令执行，默认端口 22。认证用密码或公钥，服务端的公钥列表放在 `~/.ssh/authorized_keys`。公网上只要开着 22 端口的 IPv4 主机，都会持续收到针对 `root` 和常见用户名的字典尝试。服务端可以调 `sshd_config` 里的 `PasswordAuthentication`、`PermitRootLogin` 和 `MaxStartups`，前面再挡一层 fail2ban。

![SSH 通过 22 端口连接，由服务器拿 authorized_keys 校验公钥，再开启加密会话。](../Diagrams/ssh.remote-auth.svg)

## 相关

- [[zh/Techniques/fail2ban-escalating-ban-formula|fail2ban-escalating-ban-formula]]
- [[zh/Cheatsheets/process-network|process-network]]
