---
type: trick
date: 2026-06-29
tags: [infra, chezmoi]
---
# 手写配置迁入模板

工具原来用手写配置，后来改用模板生成，比如给 [[zh/Glossary/chezmoi|chezmoi]] 加 `.chezmoi.toml.tmpl`，第一次跑 `init` 或 `generate` 就会用模板输出覆盖整份文件。动手前把手写配置逐段并进模板，加密配置块、源路径、各种开关都别漏。否则第一次运行就会把原配置抹掉，而手写文件通常没进 git，也就找不回来了。

![第一次 chezmoi init 完全按模板生成配置，模板必须包含所有旧配置段。](../Diagrams/merge-old-config-before-templating.first-generation.svg)

## 相关

- [[zh/Glossary/chezmoi|chezmoi]]
- [[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]
