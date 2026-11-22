---
type: pattern
date: 2026-07-22
tags: [pattern, git, claude-code, workflow]
---
# git worktree 中并行的 Claude Code 会话

## 适用场景

想同时改同一仓库的两个分支，比如在 VS Code 开两个终端各跑一个 Claude Code 会话。挤在同一目录不行：==单个工作目录同一时间只能检出一个分支==，两边看同一批文件，这边 `git checkout`，那边的工作状态就被抽走了。

![两个分支工作树共用仓库数据库，两套 CLAUDE_CONFIG_DIR 则分别隔离 Claude 会话的登录和设置。](../Diagrams/parallel-claude-code-sessions-with-git-worktrees.session-isolation.svg)

## 做法

**1. 每个分支单开一个 [[zh/Glossary/worktree|worktree]]**（共用同一套 `.git`，不用重新 clone）：

```bash
git worktree add ../<repo>-b2 <branch-2>   # new directory, checks out the other branch
```

两个终端各自进自己的目录跑 `claude`，互不干扰。用完删掉：

```bash
git worktree remove ../<repo>-b2
git worktree list                          # list current worktrees
```

**2. 同时跑两个账号时，靠 `CLAUDE_CONFIG_DIR` 隔离**（本机已配好，见来源案例）：

```bash
alias claude1='CLAUDE_CONFIG_DIR=~/.claude claude'
alias claude2='CLAUDE_CONFIG_DIR=~/.claude-account2 claude'
```

第一次跑 `claude2` 走正常浏览器登录，token 写进独立目录。后面两个终端分别跑 `claude1` 和 `claude2`，认证、设置和会话记录各自独立，不用登出切换。

## 原理

- worktree 让多个工作目录共用一套 `.git` 数据库：分支、stash 和配置只存 1 份，每个目录有自己的检出和 index，文件层天然隔离。
- Claude Code 的登录态和配置全在配置目录里，`CLAUDE_CONFIG_DIR` 指哪就用哪。两个进程指不同目录就是两个独立账号，这是官方支持的机制，不是临时变通。

## 注意与反例

- 同一个分支不能在两个 worktree 同时检出，git 会直接拒绝。
- `node_modules` 这类被忽略的构建产物不共享，新 worktree 得自己跑 `pnpm install`。
- 两边同时起 dev server 会抢端口（如 5173），一边换端口或者只起一边。
- 双账号并行前提是配置别分岔，共用内容用符号链接，见来源案例。
- 只想并行、额度够用时，单账号开两个会话就行；第二个账号就是为了把额度翻倍。

## 来源案例

- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]：claude1/claude2 alias 和 `CLAUDE_CONFIG_DIR` 隔离的由来。
- 2026-07-22 会话：为在临时 demo 分支并行改代码做的调研，跟社区常用的 worktree 加配置目录隔离一致。
