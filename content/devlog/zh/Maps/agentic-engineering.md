---
type: moc
tags: [moc, claude-code, multi-agent, context-engineering, hooks, mcp, llm]
---
# Agent 工程

26 篇笔记，横跨 `Cases/`、`Techniques/`、`Agents/`、`Glossary/`。

![检查实际配置、钩子日志和跨面板依赖，可以识别三类不同的代理故障。](../Diagrams/agentic-engineering.control-surfaces.svg)

## 声明的配置与生效的配置

这里反复出现最多的根因。4 篇笔记落在 4 个不同层次，问题形态一样。

- [[zh/Agents/mcp-server-config-location|mcp-server-config-location]]：全局 MCP 配置在 `CLAUDE_CONFIG_DIR/.claude.json`，不是手写的 `.mcp.json`。
- [[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]：server 配好了，却没出现在 `/mcp`。
- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]：本地文件全对，实际读的是过期的订阅档位缓存。
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]：能抓住上面 3 类问题的排查习惯。

## Hook 与 guard

guard 拦得太宽，和悄悄什么都不做，从外面看一样难分辨。

- [[zh/Agents/verify-hooks-fire-before-trusting-them|verify-hooks-fire-before-trusting-them]]：hook 没跑却退出 0，看着跟正常工作一模一样。
- [[zh/Agents/widening-a-hook-matcher-revisits-every-rule|widening-a-hook-matcher-revisits-every-rule]]：扩大 matcher 会改变每条旧规则的含义。
- [[zh/Agents/env-file-protection-patterns-fire-on-non-secret-operations|env-file-protection-patterns-fire-on-non-secret-operations]]：按文件名匹配，不看访问意图。
- [[zh/Techniques/check-hook-logs-when-an-agent-claims-no-permission|check-hook-logs-when-an-agent-claims-no-permission]]：看 guard 日志，别信 agent 的转述。
- [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]：沙箱拦的是写入，npm 却报文件归 root 所有；把缓存指到 `$TMPDIR` 下。

## 上下文工程

- [[zh/Cases/Design/2026-07-25-trimming-claude-md-and-splitting-agents-index|2026-07-25-trimming-claude-md-and-splitting-agents-index]]：把常驻文件拆成入口和索引。
- [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]：删文字和去掉 `@import`，在 diff 里长得一样。
- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]：两个账号共用一棵配置树，清掉失效 hook。

## 多 agent 协作

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]：4 个 agent 按文件归属分工，以及漏掉依赖的那道边界。
- [[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]]：从那次事故里提炼的教训。
- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]：会话隔离机制。

- [[zh/Cases/Design/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign|2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]：Codex 团队在 1 个 5773 行的 PR 里重做了 Web UI；协调者审图查出 5 处缺陷，之前 248 对截图和 6 轮审查全放过了。
- [[zh/Agents/review-delegated-visual-work-by-opening-the-screenshots|review-delegated-visual-work-by-opening-the-screenshots]]：合并前先打开 `after` 文件看，再做一轮边界明确的返工。

## 落在服务端而不是提示词里的约束

- [[zh/Agents/post-edit-formatter-drops-an-import-added-before-its-use|post-edit-formatter-drops-an-import-added-before-its-use]]：把两步编辑变成 `NameError` 的那个 hook。

## LLM 代理

- [[zh/Cases/Debug/2026-06-25-newapi-model-listed-but-unusable|2026-06-25-newapi-model-listed-but-unusable]]：列出来不代表调得通。
- [[zh/Techniques/verifying-an-llm-proxy-serves-the-real-model|verifying-an-llm-proxy-serves-the-real-model]]：从那次案例提炼出的响应分类决策树。
- [[zh/Glossary/MCP|MCP]] · [[zh/Glossary/newapi|newapi]]
