---
type: trick
date: 2026-06-29
tags: [infra, chezmoi]
---
# 手写配置迁入模板

工具原先用手写配置，改成模板生成后（比如给 [[zh/Glossary/chezmoi|chezmoi]] 加 `.chezmoi.toml.tmpl`），第一次 `init` 或 `generate` 会拿模板输出直接覆写整份文件。动手前先把旧手写配置逐段搬进模板，加密块、源路径、开关都别漏。不然第一次跑就会抹掉原配置，手写文件通常又没进 git，丢了就找不回来。

![第一次 chezmoi init 完全按模板生成配置，模板必须包含所有旧配置段。](../Diagrams/merge-old-config-before-templating.first-generation.svg)

## 相关

- [[zh/Glossary/chezmoi|chezmoi]]
- [[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]
