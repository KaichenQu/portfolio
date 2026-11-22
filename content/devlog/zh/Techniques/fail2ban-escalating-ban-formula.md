---
type: trick
date: 2026-09-05
tags: [infra, security, ssh, fail2ban]
---
# fail2ban 的递增封禁公式

fail2ban 配上 `bantime.increment` 和 `bantime.formula` 里的 Python 表达式，可以让同一 IP 每次再来时封禁时长递增。`ban.Count` 是该 IP 此前封禁次数，`ban.Time` 是基础 `bantime`，`bantime.maxtime` 管上限。下面这套写法前两次按基础时长，第 3 次起指数增长：

![前两次封禁各一小时，之后升至 8、16 和 32 小时，最终达到 30 天上限。](../Diagrams/fail2ban-escalating-ban-formula.ban-duration.svg)

```ini
[DEFAULT]
bantime  = 1h
bantime.increment = true
bantime.maxtime = 30d
bantime.formula = ban.Time * (1 if ban.Count < 2 else 2 ** min(ban.Count + 1, 20))
```

对应的封禁时长：

| 第几次封禁 | `ban.Count` | 时长 |
|---|---|---|
| 1 | 0 | 1 h |
| 2 | 1 | 1 h |
| 3 | 2 | 8 h |
| 4 | 3 | 16 h |
| 5 | 4 | 32 h |
| n | n-1 | 2^n h，从第 10 次起封顶 30 d |

两道上限保证 `ban.Count` 再大，结果也有界：`min(..., 20)` 限指数，`bantime.maxtime` 限乘积。别重置计数，也别取模。它只是 fail2ban 的 sqlite 库里每个 IP 存的一个小整数，重置等于让反复来犯的 IP 重新从短封禁开始。

`dbpurgeage` 默认 1 天，过期就清空 IP 历史，再来从第 1 次算。想让递增封禁跨过安静期，得把这项调高。这是 daemon 级配置，不是 `jail.local` 里的分服务配置：写在 `jail.local` 的 `[DEFAULT]` 下会静默忽略，`fail2ban-client -d` 照样打 `dbpurgeage 1d`。要写进 `/etc/fail2ban/fail2ban.local`：

```ini
[Definition]
dbpurgeage = 60d
```

`systemctl restart fail2ban` 不会丢封禁历史，启动日志里能看到 `Restore Ban`。

想确认 daemon 实际会加载什么，直接导出解析后的配置；只读文件，不用 sudo 也不用起 daemon：

```bash
fail2ban-client -d | grep -E "formula|maxtime|increment|purgeage"
```

v1.0.2 就算公式已经生效，`sudo fail2ban-client get sshd bantime.formula` 也会打 `None`，拿它验不准。重启后稍等两三秒再查依赖 socket 的 `fail2ban-client`：`sudo systemctl restart fail2ban && sleep 3 && sudo fail2ban-client status sshd`。

## 相关

- [[zh/Cheatsheets/process-network|process-network]]
- [[zh/Glossary/SSH|SSH]]
