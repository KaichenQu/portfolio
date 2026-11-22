---
type: glossary
tags: [glossary, infra]
---
# 模板空白裁剪（whitespace-trimming）

**全称**：template whitespace trimming（Go text/template）

Go 模板（[[zh/Glossary/chezmoi|chezmoi]]、Helm 等都在用）在动作分隔符旁加 `-`，就会吞掉相邻的空白和换行：`{{- ` 向左裁，` -}}` 向右裁，目的是不让控制逻辑（`if`、`range`、`end`）在输出里留空行。

![{{- end -}} 的右侧裁剪把 TOML 数据段标题粘到注释后，保留换行可恢复独立表段。](../Diagrams/whitespace-trimming.newline-loss.svg)

坑在于 `-}}` 会一路裁到下一个非空白字符，连想保留的换行也照吞。多行控制逻辑要是每行都用 `-}}` 结尾，后面的正文就会粘到上一行末尾。

用例：

> 末尾的 `{{- end -}}` 吞掉了紧跟着的换行，下一行 TOML 表头 `[data]` 粘到上一行注释末尾，解析器把整行当成了注释。去掉末尾的 `-`，改成 `{{- end }}`，换行就保住了。

## 相关

- [[zh/Glossary/chezmoi|chezmoi]]
- [[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]
