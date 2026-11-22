---
type: trick
date: 2026-09-05
tags: [infra, security, ssh, fail2ban]
---
# fail2ban 的递增封禁公式

fail2ban 用 `bantime.increment` 和 `bantime.formula` 里的 Python 表达式，可以让同一 IP 每次再出现时封得更久。`ban.Count` 是该 IP 以前遭封禁的次数，`ban.Time` 是基础 `bantime`，`bantime.maxtime` 给结果设上限。下面的配置让前两次用基础时长，第 3 次开始指数增长：

![前两次封禁各一小时，之后升至 8、16 和 32 小时，最终达到 30 天上限。](../Diagrams/fail2ban-escalating-ban-formula.ban-duration.svg)

```ini
[DEFAULT]
bantime  = 1h
bantime.increment = true
bantime.maxtime = 30d
bantime.formula = ban.Time * (1 if ban.Count < 2 else 2 ** min(ban.Count + 1, 20))
```

对应的封禁时长如下。

| 第几次封禁 | `ban.Count` | 时长 |
|---|---|---|
| 1 | 0 | 1 h |
| 2 | 1 | 1 h |
| 3 | 2 | 8 h |
| 4 | 3 | 16 h |
| 5 | 4 | 32 h |
| n | n-1 | 2^n h，从第 10 次起封顶 30 d |

两个上限保证 `ban.Count` 再大结果也有界：`min(..., 20)` 限制指数，`bantime.maxtime` 限制乘积。别重置计数，也别取模。它只是 fail2ban 的 sqlite 数据库给每个 IP 存的小整数，重置等于让反复违规的 IP 重新从短时封禁开始。

`dbpurgeage` 默认是 1 天，过了就丢掉 IP 历史，再来会从第 1 次封禁算。要让递增封禁跨过安静期，就得调高它。那是 daemon 的配置。写在 `jail.local` 的 `[DEFAULT]` 下会静默忽略，`fail2ban-client -d` 仍然打印 `dbpurgeage 1d`。正确位置是 `/etc/fail2ban/fail2ban.local`：

```ini
[Definition]
dbpurgeage = 60d
```

`systemctl restart fail2ban` 不会丢封禁历史，启动日志会显示 `Restore Ban`。

导出解析后的配置，就能确认 daemon 会加载什么。这只读文件，无需 sudo，也无需运行 daemon：

```bash
fail2ban-client -d | grep -E "formula|maxtime|increment|purgeage"
```

v1.0.2 即使已经应用公式，`sudo fail2ban-client get sshd bantime.formula` 也会打印 `None`，不能拿它验证。重启后稍等再发需要 socket 的 `fail2ban-client` 查询：`sudo systemctl restart fail2ban && sleep 3 && sudo fail2ban-client status sshd`。

## 相关

- [[zh/Cheatsheets/process-network|process-network]]
- [[zh/Glossary/SSH|SSH]]
