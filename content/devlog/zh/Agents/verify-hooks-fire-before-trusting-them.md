---
type: agent-lesson
date: 2026-07-07
tags: [claude-code, hooks, config]
---
# 退出码为 0 的 hook 与实际拦截验证

**错误**：Claude Code settings.json 里有两条自定义 PreToolUse guard hook，拦 `.env` 写入和 `rm -rf /`。两条都读 `$CLAUDE_TOOL_INPUT`，从没拦到过：变量为空，grep 匹配不到，退出码 0，工具照常调用。另有 13 条 claudekit hook 中的 9 条执行记录始终为 0，但每次 edit 或 stop 仍会启动进程。

![Claude Code 从标准输入传递事件，拦截器却读取空环境变量，因此静默放行了本应命中的调用。](../Diagrams/verify-hooks-fire-before-trusting-them.hook-input.svg)

**根因**：Claude Code 只经 stdin 用 JSON 传 hook 输入，没有 `CLAUDE_TOOL_INPUT` 环境变量。guard hook 没有正向信号，「没匹配，放行」和「坏了，放行」的可见结果相同，不看执行日志就发现不了。

**以后的规则**：
- hook 命令必须从 stdin 读 JSON（`tool_input.command`、`tool_input.file_path`），别用 `CLAUDE_*` 环境变量取工具输入。
- 加完或审计 hook 后，要验它确实触发。查 `~/.claudekit/logs/hook-stats.json` 或 debug 日志，也可以手写 stdin JSON 喂给它，确认走到了拒绝分支。
- 声明式权限规则（`deny: Write(**/.env*)`）能写出相同限制时，就用它，少一处会静默失效的逻辑。

**来源**：[[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]（完整案例，含排查时间线）。
