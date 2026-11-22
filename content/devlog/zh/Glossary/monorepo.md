---
type: glossary
tags: [glossary]
---
# monorepo

**全称**：monolithic repository
**中文**：单体仓库

把多个包或应用放在同一仓库，一起做版本管理和构建（`apps/*`、`packages/*`）。[[zh/Glossary/pnpm-workspace|pnpm-workspace]] 这类 workspace 工具在本地把它们连起来。没有 `package.json` 的包不在全仓命令的覆盖范围。因此 `vp check` 全绿，说明不了同一目录树里的 Python 服务是否通过。

![Python 服务和其他包同处一个仓库，但 vp check 只覆盖 pnpm 工作区，因此服务需要单独跑 pytest。](../Diagrams/monorepo.workspace-membership.svg)

用例：

> battery API 在 monorepo 里，但没进 workspace，pytest 要单独跑。

## 相关

- [[zh/Glossary/pnpm-workspace|pnpm-workspace]]
