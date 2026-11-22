---
type: agent-lesson
date: 2026-09-05
tags: [infra, shell, sudo, fail2ban, sshd]
---
# 用户代跑命令时的完整目标配置

**错误**：agent 在那台机器上没有 sudo，把 fail2ban 和 sshd 改动分几轮聊天发给同事代跑。第 N 轮给 `jail.local` 加 `bantime.increment`、`bantime.maxtime` 和 `bantime.formula`。同事改过数字后，第 N+1 轮给出增量命令 `sed -i 's|^bantime.maxtime = .*|...|'`。但同事跳过了第 N 轮。`sed` 什么都没匹配，退出码还是 0。紧接在同一行 `systemctl restart` 之后的 `fail2ban-client` 又报 `Failed to access socket path:/var/run/fail2ban/fail2ban.sock`，因为 daemon 还在启动。同事以为「改坏了」。

![sed 增量修改没匹配到原设置却成功退出，完整写入 jail.local 才能直接建立目标状态。](../Diagrams/hand-over-full-state-config-not-deltas.target-file.svg)

**根因**：
- 增量改动依赖文件现状。agent 看不到用户实际粘贴过哪些命令，发给用户时无法验证假设。
- `sed -i` 匹配不到时静默跳过，双方都看不出改动没落地。
- `fail2ban-client` 要用 daemon 的 socket，它在 `systemctl restart` 返回后还要等一会儿才出现。

**以后的规则**：
- 别人代跑时，每组命令都要写出完整目标状态，例如 `tee file <<'EOF' ... EOF`，或者在 `conf.d/` 下放完整 drop-in。这样不管之前的命令跑过没有都正确。能先读回文件再发改动时，才用增量命令。
- 发远端文件的修改前，先走可用的只读通道，用 `cat` 查看当前内容，在回复里引用相关行。
- 用 `&& sleep 3 &&` 把重启和查询隔开，或把查询单列一行。先说明报 socket 错误是查得太早，服务未必坏了。
- 每组代跑命令末尾都附上验证命令，写清预期输出，现场就能抓到静默跳过。
