---
type: agent-lesson
date: 2026-06-29
tags: [chezmoi, config]
---
# 配置模板对手写配置的覆盖

**错误**：chezmoi 原先靠手写的 `~/.config/chezmoi/chezmoi.toml` 配置，里面带着 `[age]` 加密块。加上 `.chezmoi.toml.tmpl` 后跑 `chezmoi init` 加载新的 `[data]` 变量，init 用只含 `[data]` 的模板重建整份配置，悄悄把 `[age]` 丢了。之后每次 apply 都报 `decrypt: encryption not configured`。旧配置没进 git，历史里找不回来。

![chezmoi init 用仅含数据段的模板重写配置，导致 age 解密配置丢失。](../Diagrams/config-template-overwrites-handwritten-config.source-of-truth.svg)

**根因**：有了配置模板，生成的配置就只认模板。`chezmoi init` 会按模板整份重写目标配置，模板里没写的段全都会丢。

**以后的规则**：
- 给原先手写配置的工具加模板前，先读现有配置，把每一段都搬进模板（加密、源目录、选项）。
- 把会覆写未跟踪文件的 `init` 或 `generate` 当成破坏性操作，运行前先备份目标文件，或用 `git diff` 核对。
- 对 chezmoi age，只要私钥还在，可以用 `age-keygen -y <identity-file>` 从 identity 推回 recipient。
- 多行模板控制逻辑如果每行都以 `-}}` 结尾，会吞掉行末换行，把后面的 `[data]` 表头之类粘到上一行。要保换行的地方用 `{{- end }}`，末尾别加横杠。
- 反过来也一样：直接改已部署的 dotfile 前先跑 `chezmoi managed`，受管理就改源或改完跑 `chezmoi re-add`，不然下次 `chezmoi apply` 会冲掉改动。但 `.tmpl` 渲染出的目标绝不能 `re-add`（会把模板压平），只能改模板。

**来源**：[[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]、[[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]（完整案例，含排查时间线）。
