---
type: glossary
tags: [glossary, infra, dotfiles]
---
# chezmoi

**类别**：dotfiles 管理工具

把主目录里的配置文件（`.zshrc`、`.gitconfig`、`~/.claude/` 等）收进同一个 git 仓库，跨机器同步。源仓库默认在 `~/.local/share/chezmoi`，文件名按约定表达状态：`dot_` 前缀对应目标文件开头的 `.`，`.tmpl` 后缀表示 Go 模板，`encrypted_` 前缀加 `.age` 或 `.asc` 表示加密文件，`private_` 表示收紧权限。

![chezmoi 从源文件名 dot_zshrc.tmpl 识别模板，apply 渲染后写入主目录的 .zshrc。](../Diagrams/chezmoi.source-to-home.svg)

常用命令：

| 命令 | 用途 |
|---|---|
| `chezmoi status` / `chezmoi diff` | 对比本地文件和源仓库（两列状态，跟 git 类似） |
| `chezmoi add` / `chezmoi re-add` | 把本地改动拉回源仓库 |
| `chezmoi apply` | 把源仓库渲染到主目录，包括模板展开和解密 |
| `chezmoi cat <file>` | 只打印单个文件的渲染结果，不应用：先 cat，再 apply |
| `chezmoi encrypt` / `decrypt` | 通过 [[zh/Glossary/age\|age]] 或 gpg 加解密 |

模板支持 `{{ include "..." | decrypt }}`、`{{ keyring ... }}` 这类函数，常用来把凭据从明文里移出去。

## 相关

- [[zh/Glossary/age|age]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
