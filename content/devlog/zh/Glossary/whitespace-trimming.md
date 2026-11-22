---
type: glossary
tags: [glossary, infra]
---
# 模板空白裁剪（whitespace-trimming）

**全称**：template whitespace trimming（Go text/template）

Go 模板（[[zh/Glossary/chezmoi|chezmoi]]、Helm 等使用）在动作分隔符旁加 `-`，就会吞掉相邻的空白和换行：`{{- ` 向左裁，` -}}` 向右裁。目的是避免控制逻辑（`if`、`range`、`end`）在输出里留下空行。

![{{- end -}} 的右侧裁剪把 TOML 数据段标题粘到注释后，保留换行可恢复独立表段。](../Diagrams/whitespace-trimming.newline-loss.svg)

要留神的是，`-}}` 会一路裁到下一个非空白字符，想保留的换行也照样吞。多行控制逻辑如果每行都以 `-}}` 结束，后面的实际内容就会粘到上一行末尾。

用例：

> 末尾的 `{{- end -}}` 吞了紧随其后的换行，下一行 TOML 表头 `[data]` 就粘到上一行注释末尾，解析器把整行当作注释。去掉末尾的 `-`，改成 `{{- end }}`，换行就保住了。

## 相关

- [[zh/Glossary/chezmoi|chezmoi]]
- [[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]
