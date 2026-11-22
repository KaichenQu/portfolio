---
type: agent-lesson
date: 2026-06-29
tags: [chezmoi, config]
---
# 配置模板对手写配置的覆盖

**错误**：chezmoi 原先靠手写的 `~/.config/chezmoi/chezmoi.toml` 配置，里面有 `[age]` 加密块。加上 `.chezmoi.toml.tmpl` 后，跑 `chezmoi init` 加载新的 `[data]` 变量。init 用只有 `[data]` 的模板重建整份配置，悄悄丢掉了 `[age]`。结果每次 apply 都报 `decrypt: encryption not configured`。旧配置没进 git，无法从历史恢复。

![chezmoi init 用仅含数据段的模板重写配置，导致 age 解密配置丢失。](../Diagrams/config-template-overwrites-handwritten-config.source-of-truth.svg)

**根因**：有配置模板后，生成的配置只认模板。`chezmoi init` 会整份重写目标配置，模板里没写的段落都会丢失。

**以后的规则**：
- 给原先手写配置的工具加模板前，先读现有配置，把各段逐一搬进模板（加密、源目录、选项）。
- 把会写未跟踪文件的 `init` 或 `generate` 当成破坏性操作。运行前给目标做备份，或用 `git diff` 检查目标。
- 对 chezmoi age，若私钥还在，可用 `age-keygen -y <identity-file>` 从 identity 找回 recipient。
- 多行模板控制逻辑如果每行都以 `-}}` 收尾，会吞掉行末换行，把后面的内容（例如 `[data]` 表头）粘到上一行。要保留换行的地方用 `{{- end }}`，末尾不带横杠。
- 反过来也会踩坑。直接改已部署的 dotfile 前先跑 `chezmoi managed`。目标受管理就改源，或改完跑 `chezmoi re-add`，否则下次 `chezmoi apply` 会还原改动。从 `.tmpl` 渲染出来的目标不能 `re-add`，否则会把模板压平。要改就改模板。

**来源**：[[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]、[[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]（完整案例，含排查时间线）。
