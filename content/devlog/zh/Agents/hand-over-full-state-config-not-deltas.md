---
type: agent-lesson
date: 2026-09-05
tags: [infra, shell, sudo, fail2ban, sshd]
---
# 用户代跑命令时的完整目标配置

**错误**：agent 在那台机器上没 sudo，把 fail2ban 和 sshd 改动分几轮聊天发给同事代跑。第 N 轮给 `jail.local` 加 `bantime.increment`、`bantime.maxtime` 和 `bantime.formula`；同事调完数字后，第 N+1 轮发了增量命令 `sed -i 's|^bantime.maxtime = .*|...|'`。可同事跳过了第 N 轮。`sed` 什么都没匹配上，退出码仍是 0；紧接在同一行 `systemctl restart` 后面的 `fail2ban-client` 又报 `Failed to access socket path:/var/run/fail2ban/fail2ban.sock`（daemon 还在起）。同事以为改坏了。

![sed 增量修改没匹配到原设置却成功退出，完整写入 jail.local 才能直接建立目标状态。](../Diagrams/hand-over-full-state-config-not-deltas.target-file.svg)

**根因**：
- 增量命令建立在对文件现状的假设上。agent 看不见用户实际贴了哪几段，发出去时没法验这个假设。
- `sed -i` 匹配不到就静默跳过，双方都看不出改动没落进文件。
- `fail2ban-client` 依赖 daemon 的 socket，`systemctl restart` 返回后还要等一会儿才建好。

**以后的规则**：
- 别人代跑时，每组命令都写完整目标状态，比如 `tee file <<'EOF' ... EOF`，或者往 `conf.d/` 写完整 drop-in，不管前面跑没跑过都能落到正确状态。只有自己能先读回文件时，才用增量命令。
- 发远端文件修改前，先用可用的只读通道 `cat` 出当前内容，并在回复里引出相关行。
- 重启和查询之间用 `&& sleep 3 &&` 隔开，或分两行写，并提前交代 socket 报错只是查早了，不是服务坏了。
- 每组代跑命令末尾补一条验证命令并写清预期输出，现场就能抓到静默跳过。
