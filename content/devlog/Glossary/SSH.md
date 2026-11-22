---
type: glossary
tags: [glossary]
---
# SSH

**Full name**: Secure Shell
**Chinese**: 安全外壳协议

Encrypted remote login and command execution, port 22 by default. Authentication is by password or by public key (`~/.ssh/authorized_keys` on the server). Every public IPv4 host with port 22 open receives continuous dictionary attempts against `root` and common usernames; the server-side knobs are `PasswordAuthentication`, `PermitRootLogin`, `MaxStartups` in `sshd_config`, plus fail2ban in front of it.

![Secure Shell authenticates the connecting user with a password or a public key, then supports remote login or command execution over an encrypted connection.](../Diagrams/ssh.remote-auth.svg)

## Related
- [[fail2ban-escalating-ban-formula]]
- [[process-network]]
