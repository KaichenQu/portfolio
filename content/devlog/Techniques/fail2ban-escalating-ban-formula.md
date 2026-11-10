---
type: trick
date: 2026-09-05
tags: [infra, security, ssh, fail2ban]
---
# fail2ban escalating ban time with a custom formula

fail2ban can lengthen the ban for an IP each time it comes back, using `bantime.increment` and a Python expression in `bantime.formula`. `ban.Count` is the number of previous bans for that IP, `ban.Time` is the base `bantime`, and `bantime.maxtime` caps the result. This shape keeps the first two bans at the base time and goes exponential from the third:

```ini
[DEFAULT]
bantime  = 1h
bantime.increment = true
bantime.maxtime = 30d
bantime.formula = ban.Time * (1 if ban.Count < 2 else 2 ** min(ban.Count + 1, 20))
```

Resulting ban lengths:

| Ban number | `ban.Count` | Length |
|---|---|---|
| 1 | 0 | 1 h |
| 2 | 1 | 1 h |
| 3 | 2 | 8 h |
| 4 | 3 | 16 h |
| 5 | 4 | 32 h |
| n | n-1 | 2^n h, capped at 30 d from the 10th ban |

Two ceilings keep the number bounded whatever `ban.Count` grows to: `min(..., 20)` on the exponent and `bantime.maxtime` on the product. Do not reset or modulo the count; it is a small integer per IP in fail2ban's sqlite database and resetting it hands a repeat offender a fresh short ban.

`dbpurgeage` defaults to one day, after which an IP's history is forgotten and it starts again from ban 1. Raise it so the escalation survives quiet periods. It is a daemon setting, not a jail setting: placed under `[DEFAULT]` in `jail.local` it is silently ignored (`fail2ban-client -d` still prints `dbpurgeage 1d`). It belongs in `/etc/fail2ban/fail2ban.local`:

```ini
[Definition]
dbpurgeage = 60d
```

Ban history persists across `systemctl restart fail2ban`; the log shows `Restore Ban` lines on startup.

Verify what the daemon will load by dumping the parsed config; this reads the files, needs no sudo and no running daemon:

```bash
fail2ban-client -d | grep -E "formula|maxtime|increment|purgeage"
```

`sudo fail2ban-client get sshd bantime.formula` prints `None` on v1.0.2 even when the formula is active, so it is not a usable check. After a restart give the daemon a moment before any `fail2ban-client` query that does need the socket: `sudo systemctl restart fail2ban && sleep 3 && sudo fail2ban-client status sshd`.

## Related
- [[process-network]]
- [[SSH]]
