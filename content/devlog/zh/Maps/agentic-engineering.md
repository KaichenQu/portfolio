---
type: moc
tags: [moc, claude-code, multi-agent, context-engineering, hooks, mcp, llm]
---
# Agent 工程

26 篇笔记，横跨 `Cases/`、`Techniques/`、`Agents/`、`Glossary/`。

![检查实际配置、钩子日志和跨面板依赖，可以识别三类不同的代理故障。](../Diagrams/agentic-engineering.control-surfaces.svg)

## 声明的配置与生效的配置

这里反复出现最多的根因。4 篇笔记出自 4 个不同层次，问题形态相同。

- [[zh/Agents/mcp-server-config-location|mcp-server-config-location]]：全局 MCP 配置在 `CLAUDE_CONFIG_DIR/.claude.json`，手写的 `.mcp.json` 不参与读取。
- [[zh/Cases/Debug/2026-06-22-tradingview-mcp-not-registering|2026-06-22-tradingview-mcp-not-registering]]：server 已配置，却没出现在 `/mcp`。
- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]：本地文件全对，实际用的是旧的订阅档位缓存。
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]：能抓住上述 3 类问题的排查习惯。

## Hook 与 guard

guard 拦得太宽，或悄悄什么都没做，从外面看都一样难辨认。

- [[zh/Agents/verify-hooks-fire-before-trusting-them|verify-hooks-fire-before-trusting-them]]：hook 没工作却退出 0，看起来和正常执行一样。
- [[zh/Agents/widening-a-hook-matcher-revisits-every-rule|widening-a-hook-matcher-revisits-every-rule]]：扩大 matcher 会改变每条旧规则的含义。
- [[zh/Agents/env-file-protection-patterns-fire-on-non-secret-operations|env-file-protection-patterns-fire-on-non-secret-operations]]：规则匹配的是名字，看不到访问意图。
- [[zh/Techniques/check-hook-logs-when-an-agent-claims-no-permission|check-hook-logs-when-an-agent-claims-no-permission]]：以 guard 日志为准，agent 的说法是转述。
- [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]：沙箱拦的是写入，npm 却说文件归 root 所有。把缓存设在 `$TMPDIR` 下。

## 上下文工程

- [[zh/Cases/Design/2026-07-25-trimming-claude-md-and-splitting-agents-index|2026-07-25-trimming-claude-md-and-splitting-agents-index]]：将常驻文件拆成入口和索引。
- [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]：删文字和去掉 `@import`，在 diff 里看起来一样。
- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]：两个账号共用一棵配置树，清掉失效 hook。

## 多 agent 协作

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]：4 个 agent 按文件归属拆活，以及没挡住依赖的那道边界。
- [[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]]：从这次事故里提炼的经验。
- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]：会话隔离机制。

- [[zh/Cases/Design/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign|2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]：Codex 团队在 1 个 5773 行的 PR 里重做 Web UI。协调者审图发现 5 处缺陷，之前 248 对截图、6 轮审查都没发现。
- [[zh/Agents/review-delegated-visual-work-by-opening-the-screenshots|review-delegated-visual-work-by-opening-the-screenshots]]：合并前打开 `after` 文件看，再做有明确范围的第二轮。

## 服务端的约束

- [[zh/Agents/post-edit-formatter-drops-an-import-added-before-its-use|post-edit-formatter-drops-an-import-added-before-its-use]]：hook 怎样让两步编辑以 `NameError` 告终。

## LLM 代理

- [[zh/Cases/Debug/2026-06-25-newapi-model-listed-but-unusable|2026-06-25-newapi-model-listed-but-unusable]]：列出来不代表调得通。
- [[zh/Techniques/verifying-an-llm-proxy-serves-the-real-model|verifying-an-llm-proxy-serves-the-real-model]]：从案例提炼出的响应分类决策树。
- [[zh/Glossary/MCP|MCP]] · [[zh/Glossary/newapi|newapi]]
