---
type: agent-lesson
date: 2026-11-04
tags: [openapi, codegen, ci-cd]
publish: true
---
# 重新生成契约后的 hunk 取舍

**错误**：▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ PR ▒▒▒▒ 在 Mac 上跑 `scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 重新生成了 `agent_docs/2026-08-12-fullstack-chat/api-contract.yaml`。dump 同时把无关的 `Source` enum 从 `mock, real` 翻成了 `real, mock`。agent 看到这处翻转，以为已提交的 YAML 过期了，就合进了功能提交。CI 重生成契约后跑 `git diff --exit-code`，正好卡在这一个 hunk 上，`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 失败。

**根因**：生成的 OpenAPI 契约里 enum 顺序不确定，原因已经明确：==`StructurePredictionReportItem.source` 写的是 `Literal["real", "mock"]`，其他模型都是 `Literal["mock", "real"]`。== dump 会合并同名 enum schema，合并出的 `Source` enum 两种顺序都可能出现。

![不同的 Literal 顺序使生成的 Source 枚举翻转，api-contract.yaml 中无关的改动因此未通过 CI 差异检查。](../Diagrams/regenerated-contract-nondeterministic-enum-order.enum-flip.svg)

**以后的规则**：
- 重新生成契约后跟 `main` 做 diff，只留自己改动能解释的 hunk。
- 其余 hunk 一律还原成 main 的文本，哪怕本地生成器就是这么生成的。
- 跨机器来回翻转的 hunk 是生成器 bug，不是文件过期。回源头另开小 PR 修：把重复的 `Literal[...]` 顺序对齐，让同名 enum 保持一致。

**来源**：[[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]（完整案例，含排查时间线）。
