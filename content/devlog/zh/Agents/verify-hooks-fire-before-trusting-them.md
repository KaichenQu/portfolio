---
type: agent-lesson
date: 2026-07-07
tags: [claude-code, hooks, config]
---
# 退出码为 0 的 hook 与实际拦截验证

**错误**：Claude Code 的 settings.json 里配了两条自定义 PreToolUse guard hook，分别拦 `.env` 写入和 `rm -rf /`。两条都读 `$CLAUDE_TOOL_INPUT`，结果一次都没触发过：变量是空的，grep 匹配不上，退出码 0，工具照常执行。另外 13 条 claudekit hook 里有 9 条执行次数始终是 0，但每次 edit 或 stop 照样起进程。

![Claude Code 从标准输入传递事件，拦截器却读取空环境变量，因此静默放行了本应命中的调用。](../Diagrams/verify-hooks-fire-before-trusting-them.hook-input.svg)

**根因**：Claude Code 只通过 stdin 传 JSON 给 hook，根本没有 `CLAUDE_TOOL_INPUT` 这个环境变量。guard hook 又没有正向反馈，「没命中，放行」和「写坏了，放行」在外面看着一模一样，不翻执行日志根本发现不了。

**以后的规则**：
- hook 命令必须从 stdin 读 JSON（`tool_input.command`、`tool_input.file_path`），不要用 `CLAUDE_*` 环境变量取工具输入。
- 新增或审计 hook 后，要验证它确实会触发：查 `~/.claudekit/logs/hook-stats.json` 或 debug 日志，或者手造一份 stdin JSON 传给它，确认走到了拒绝分支。
- 声明式权限规则（`deny: Write(**/.env*)`）能表达同一拦截时，优先用规则，少一层会静默失效的逻辑。

**来源**：[[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]（完整案例，含排查时间线）。
