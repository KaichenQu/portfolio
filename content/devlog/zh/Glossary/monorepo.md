---
type: glossary
tags: [glossary]
---
# monorepo

**全称**：monolithic repository
**中文**：单体仓库

把多个包或应用收在同一个仓库里，一起做版本管理和构建（`apps/*`、`packages/*`），靠 [[zh/Glossary/pnpm-workspace|pnpm-workspace]] 这类 workspace 工具在本地把它们串起来。没有 `package.json` 的包不在全仓命令的覆盖范围内，所以 `vp check` 全绿，说明不了同一目录树里的 Python 服务有没有过。

![Python 服务和其他包同处一个仓库，但 vp check 只覆盖 pnpm 工作区，因此服务需要单独跑 pytest。](../Diagrams/monorepo.workspace-membership.svg)

用例：

> battery API 在 monorepo 里，但不在 workspace 里，pytest 得单独跑。

## 相关

- [[zh/Glossary/pnpm-workspace|pnpm-workspace]]
