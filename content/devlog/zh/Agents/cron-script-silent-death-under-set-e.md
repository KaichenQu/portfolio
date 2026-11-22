---
type: agent-lesson
date: 2026-07-07
tags: [shell, cron, macos]
---
# `set -e` 下 cron 脚本的管道容错和 stderr 日志

**错误**：cron 调度的脚本（`~/bin/cc-ping.sh`）「好几个星期没触发」。实际 cron 每次都触发了，只是脚本打完第一行日志就静默退出，stderr 进了没人收的 cron 邮件，一直没人发觉。

![Cron 确实启动了脚本，但命令替换失败触发 set -e，脚本在处理任务和留下持久错误日志之前退出。](../Diagrams/cron-script-silent-death-under-set-e.cron-exit.svg)

**根因**：`set -euo pipefail` 撞上命令替换 `result="$(security dump-keychain | grep ... | head -n1)"`。cron 下没有 GUI 安全会话，`security` 会失败；就算能跑，`grep` 没匹配到也返回 1。开了 `pipefail`，整条管道返回非零，赋值随之失败，`set -e` 在脚本干任何可见工作前就退出了。

**以后的规则**：
- cron 或 launchd 脚本第一行业务逻辑前先加 `exec 2>>"$LOG"`，让失败都能留痕。
- 开着 `set -e`，每处 `var="$(pipeline)"` 都可能杀掉脚本。允许失败的管道末尾加 `|| true`，别忘了 `grep` 无匹配时退出码就是 1。
- 尽力而为的函数写成 `f || log "WARN..."`，`||` 会同时关掉函数体内的 `set -e`。
- 用 `env -i HOME=... PATH=<crontab PATH>` 模拟 cron，但 macOS 钥匙串权限跟安全会话走、不跟环境变量走，钥匙串不可用的分支得单独做最小复现（用 `false` 替 `security`）。
- 定时任务「不触发」，先查日志里有没有 start 标记，确认过调度再怀疑 cron。

**来源**：[[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]（完整案例，含排查时间线）。
