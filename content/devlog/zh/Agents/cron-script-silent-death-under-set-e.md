---
type: agent-lesson
date: 2026-07-07
tags: [shell, cron, macos]
---
# `set -e` 下 cron 脚本的管道容错和 stderr 日志

**错误**：cron 驱动的脚本（`~/bin/cc-ping.sh`）「好几个星期没触发」。其实 cron 每次都触发了，脚本打完第一行日志就静默退出。stderr 进了没人收的 cron 邮件，所以一直没人发现。

![Cron 确实启动了脚本，但命令替换失败触发 set -e，脚本在处理任务和留下持久错误日志之前退出。](../Diagrams/cron-script-silent-death-under-set-e.cron-exit.svg)

**根因**：`set -euo pipefail` 加上命令替换 `result="$(security dump-keychain | grep ... | head -n1)"`。cron 没有 GUI 安全会话，`security` 会失败，即使它能跑，`grep` 找不到匹配也会返回 1。开启 `pipefail` 后整个管道返回非零，赋值失败，`set -e` 让脚本还没做出可见动作就退出。

**以后的规则**：
- cron 或 launchd 脚本在第一行业务逻辑前放 `exec 2>>"$LOG"`，让失败都留痕。
- 开着 `set -e`，每处 `var="$(pipeline)"` 都可能让脚本退出。允许失败的管道末尾加 `|| true`，记住 `grep` 没匹配时退出码为 1。
- 尽力而为的函数用 `f || log "WARN..."` 调用。`||` 还会让函数体内的 `set -e` 不生效。
- 用 `env -i HOME=... PATH=<crontab PATH>` 模拟 cron。macOS 钥匙串按安全会话决定能否访问，和环境变量无关。钥匙串不可用的分支要单独做最小复现，用 `false` 替代 `security`。
- 定时任务「不触发」，先看日志有没有 start 标记，确认过调度再怪 cron。

**来源**：[[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]（完整案例，含排查时间线）。
