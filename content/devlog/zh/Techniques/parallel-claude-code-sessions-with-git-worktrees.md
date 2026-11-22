---
type: pattern
date: 2026-07-22
tags: [pattern, git, claude-code, workflow]
---
# git worktree 中并行的 Claude Code 会话

## 适用场景

想同时改同一仓库的两个分支，比如 VS Code 开两个终端，各跑自己的 Claude Code 会话。放在同一目录不行：==同一工作目录同一时间只能检出一个分支==。两边看到的是同一批文件，一个终端执行 `git checkout`，另一个的工作状态就会跟着变。

![两个分支工作树共用仓库数据库，两套 CLAUDE_CONFIG_DIR 则分别隔离 Claude 会话的登录和设置。](../Diagrams/parallel-claude-code-sessions-with-git-worktrees.session-isolation.svg)

## 做法

**1. 每个分支各用一个 [[zh/Glossary/worktree|worktree]]**（共用同一套 `.git`，不用再 clone 一次）：

```bash
git worktree add ../<repo>-b2 <branch-2>   # new directory, checks out the other branch
```

两个终端各自在自己的目录里跑 `claude`，互不影响。结束后清理：

```bash
git worktree remove ../<repo>-b2
git worktree list                          # list current worktrees
```

**2. 同时跑两个账号时，用 `CLAUDE_CONFIG_DIR` 隔离**（这台机器已配置，见来源案例）：

```bash
alias claude1='CLAUDE_CONFIG_DIR=~/.claude claude'
alias claude2='CLAUDE_CONFIG_DIR=~/.claude-account2 claude'
```

第一次跑 `claude2` 会走正常的浏览器登录，把 token 存在单独的目录。以后两个终端分别跑 `claude1` 和 `claude2`，认证、设置和会话记录都各自独立，不用登出切账号。

## 原理

- worktree 让多个工作目录共用同一套 `.git` 数据库。分支、stash 和配置都只存 1 份，每个目录有自己的检出和 index，文件层自然隔离。
- Claude Code 的登录状态和配置都在配置目录里，`CLAUDE_CONFIG_DIR` 指向哪儿就用哪儿。两个进程指向不同目录，就是两个独立账号。官方支持这个机制。

## 注意与反例

- 同一分支不能同时在两个 worktree 检出，git 会直接拒绝。
- `node_modules` 一类忽略的构建产物不共享，新 worktree 得自己执行 `pnpm install`。
- 两边同时启动 dev server 会抢端口，比如 5173。给一边换端口，或者只开一边。
- 两个账号并行的前提是配置别分岔。共用内容可以用符号链接，见来源案例。
- 只想并行、额度又够时，同一账号开两个会话就可以。第二个账号是为了让额度翻倍。

## 来源案例

- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]：claude1/claude2 alias 和 `CLAUDE_CONFIG_DIR` 隔离的来源。
- 2026-07-22 会话：为了在临时 demo 分支并行编辑做的调研，和社区常用的 worktree 加配置目录隔离一致。
