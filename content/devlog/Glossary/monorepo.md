---
type: glossary
tags: [glossary]
---
# monorepo

**Full name**: monolithic repository
**Chinese**: 单体仓库

One repository holding several packages or apps that are versioned and built together (`apps/*`, `packages/*`). A workspace tool such as [[pnpm-workspace]] links them locally. A package without a `package.json` is invisible to repo-wide commands, which is why a green `vp check` says nothing about a Python service living in the same tree.

Usage example:
> The battery API is in the monorepo but not in the workspace; run its pytest separately.

## Related
- [[pnpm-workspace]]
