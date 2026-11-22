---
type: agent-lesson
date: 2026-11-04
tags: [openapi, codegen, ci-cd]
publish: true
---
# 重新生成契约后的 hunk 取舍

**错误**：▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ PR ▒▒▒▒ 在 Mac 上用 `scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 重新生成了 `agent_docs/2026-08-12-fullstack-chat/api-contract.yaml` 。dump 顺带把无关的 `Source` enum 从 `mock, real` 翻成了 `real, mock` 。agent 看到了这处翻转，认定已提交的 YAML 过期了，于是把它放进了功能提交。CI 重新生成契约，再跑 `git diff --exit-code` ，就因为这一个 hunk，`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 失败了。

**根因**：生成的 OpenAPI 契约里，enum 的顺序不确定，原因已经查清。==`StructurePredictionReportItem.source` 是 `Literal["real", "mock"]` ，其他模型都是 `Literal["mock", "real"]` 。==dump 会把同名的 enum schema 合并，所以合并出来的 `Source` enum 两种顺序都可能出现。

![不同的 Literal 顺序使生成的 Source 枚举翻转，api-contract.yaml 中无关的改动因此未通过 CI 差异检查。](../Diagrams/regenerated-contract-nondeterministic-enum-order.enum-flip.svg)

**以后的规则**：
- 重新生成契约后，和 `main` 做 diff，只保留你的改动能解释的 hunk。
- 其余 hunk 一律改回 main 的文本，本地生成器生成了也照样改回。
- 在不同机器之间来回翻转的 hunk 是生成器的 bug，不是文件过期。到源头修，单独开小 PR：把重复的 `Literal[...]` 顺序对齐，让同名 enum 完全一致。

**来源**：[[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]（完整案例，含排查时间线）。
