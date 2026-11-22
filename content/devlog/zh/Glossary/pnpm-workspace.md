---
type: glossary
tags: [glossary]
publish: true
---
# pnpm workspace

**全称**：pnpm workspace（`pnpm-workspace.yaml`）
**中文**：pnpm 工作区

pnpm 的 [[zh/Glossary/monorepo|monorepo]] 机制。`pnpm-workspace.yaml` 列出匹配包的 glob，命中的目录只要有 `package.json`，就会一起安装、链接和运行（`pnpm -r`、`--filter`）；没有 `package.json` 的目录不会被纳入。

![目录即使匹配 apps/*，缺少 package.json 时仍不会被 pnpm -r test 执行。](../Diagrams/pnpm-workspace.enrollment.svg)

用例：

> pnpm workspace 写着 `apps/*`，但 `apps/▒▒▒▒▒▒▒▒▒▒▒▒` 没有 package.json，`pnpm -r test` 根本不会跑它。

## 相关

- [[zh/Glossary/monorepo|monorepo]]
