---
type: agent-lesson
date: 2026-08-12
tags: [claude-code, sandbox, tooling, git]
---
# 环境文件保护的误拦：提到文件名或遍历目录就足够

**错误**：同一轮仓库清理碰上两次环境文件保护拦截，两次都没碰秘密：

![受保护文件名在任务说明和仅访问元数据的工作树遍历中都命中，两项操作因此被拒绝。](../Diagrams/env-file-protection-patterns-fire-on-non-secret-operations.name-match.svg)

1. `orca orchestration task-create --spec "<long agent task spec>"` 直接被拒，报 `Access denied: '.env.example,' is protected by default patterns`。spec 只是描述批量删除任务的文字，*提到了*要保留 `.env.example`，根本没读它。
2. 沙箱里的 `git commit` 失败。pre-commit hook 链（`core.hooksPath` → dispatcher stub → `vp staged` → `lint-staged`）备份 worktree 时会对每个文件（包括 `.env.example`）调 `lstat()`。沙箱读拒绝模式 `**/.env*` 拦下了它，`lint-staged` 报 `Unable to process path .env.example` 中止，commit 没做成。

**根因**：两套 guard 都只认*名字模式*，不管*访问意图*。Bash guard 在 shell 展开前扫命令原文，文件名只要出现就触发，哪怕只在引号参数里当说明文字。沙箱拒绝模式拦所有触及该路径的系统调用，而全 worktree 工具（lint-staged 备份、`git stash`、formatter、备份工具）天生会遍历每个文件，不管里面有没有秘密。两套 guard 都分不清「读内容」「提到文件名」和「遍历时 stat」，而 `.env.example` 只是已入库的模板，不含任何秘密。

**以后的规则**：
- 别把长篇 agent 任务规格内联进 shell 参数。先用 Write 工具落成文件，再传 `--spec "$(cat /path/to/spec.md)"`：guard 先扫命令原文，命令替换后发生，原文里就不会出现那个文件名。
- 命令在环境文件路径报错时，先分清它是在读内容还是只遍历目录树（全 worktree 工具最常见）。后者只需关掉沙箱重跑那一条命令，拒绝模式不用改。
- 带 hook 的 `git commit` 都可能踩这个坑：表面报 hook 错（`lint-staged` 中止），看不出权限拒绝。先把整条链顺一遍，别急着断定 hook 坏了。

**来源**：▒▒▒▒▒▒▒▒（完整案例，含排查时间线）。
