---
type: glossary
tags: [glossary]
---
# pnpm workspace

**Full name**: pnpm workspace (`pnpm-workspace.yaml`)
**Chinese**: pnpm 工作区

pnpm's [[monorepo]] mechanism: a `pnpm-workspace.yaml` lists package globs, and every matching directory with a `package.json` is installed, linked and run together (`pnpm -r`, `--filter`). Directories without a `package.json` are simply not enrolled.

Usage example:
> `apps/*` is in the pnpm workspace, but `apps/▒▒▒▒▒▒▒▒▒▒▒▒` has no package.json, so `pnpm -r test` never touches it.

## Related
- [[monorepo]]
