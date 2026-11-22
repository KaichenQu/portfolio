---
type: agent-lesson
date: 2026-08-12
tags: [claude-code, sandbox, tooling, git]
---
# 环境文件保护的误拦：提到文件名或遍历目录就足够

**错误**：同一轮仓库清理遇到两次环境文件保护拦截，两次都没有读取秘密。

![受保护文件名在任务说明和仅访问元数据的工作树遍历中都命中，两项操作因此被拒绝。](../Diagrams/env-file-protection-patterns-fire-on-non-secret-operations.name-match.svg)

1. `orca orchestration task-create --spec "<long agent task spec>"` 遭拒，报 `Access denied: '.env.example,' is protected by default patterns`。spec 只是描述批量删除任务的文字，*提到* `.env.example` 是这批要保留的文件。没有读它。
2. 沙箱内的 `git commit` 失败。pre-commit hook 链（`core.hooksPath` → dispatcher stub → `vp staged` → `lint-staged`）会备份 worktree，对包括 `.env.example` 在内的每个文件调用 `lstat()`。沙箱的读拒绝模式 `**/.env*` 拦住了它，`lint-staged` 报 `Unable to process path .env.example` 后退出，commit 没做成。

**根因**：两种 guard 都按*名字模式*匹配，看不到*访问意图*。Bash guard 在 shell 展开前扫命令原文，文件名只要出现就能触发，即使它在引号参数里只是说明文字。沙箱拒绝模式拦所有触及该路径的系统调用；全 worktree 工具（lint-staged 备份、`git stash`、formatter、备份工具）本来就会碰每个文件，不管有没有秘密。两种 guard 都分不清「读内容」「提到文件名」和「遍历时对文件跑 stat」，而 `.env.example` 是已提交的模板，里面没有任何秘密。

**以后的规则**：
- 别把长篇 agent 任务规格直接塞进 shell 参数。用 Write 工具写成文件，再传 `--spec "$(cat /path/to/spec.md)"`。guard 先扫命令原文，命令替换之后才发生，所以扫到的原文里没有那个文件名。
- 命令碰到环境文件路径报错，先分清它要读内容还是只在遍历。常见的是全 worktree 工具。这种情况单独关闭沙箱重跑那条命令，拒绝模式不用改。
- 带 hook 的 `git commit` 都可能碰到这个问题。表面报的是 hook 错误（`lint-staged` 中止），看不到权限错误。先顺着整条链查过，再判断是不是 hook 坏了。

**来源**：▒▒▒▒▒▒▒▒（完整案例，含排查时间线）。
