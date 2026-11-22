---
type: glossary
tags: [glossary]
---
# SSH

**全称**：Secure Shell
**中文**：安全外壳协议

提供加密的远程登录和命令执行，默认端口 22。可用密码或公钥认证，服务端的公钥列表在 `~/.ssh/authorized_keys`。每台开放 22 端口的公网 IPv4 主机都会持续收到针对 `root` 和常见用户名的字典尝试。服务端可调 `sshd_config` 里的 `PasswordAuthentication`、`PermitRootLogin` 和 `MaxStartups`，外面还可以加 fail2ban。

![SSH 通过 22 端口连接，由服务器拿 authorized_keys 校验公钥，再开启加密会话。](../Diagrams/ssh.remote-auth.svg)

## 相关

- [[zh/Techniques/fail2ban-escalating-ban-formula|fail2ban-escalating-ban-formula]]
- [[zh/Cheatsheets/process-network|process-network]]
