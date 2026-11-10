---
type: glossary
tags: [glossary, infra]
---
# whitespace-trimming

**Full name**: template whitespace trimming (Go text/template)

In Go templates (used by [[chezmoi]], Helm, and others), adding `-` next to an action delimiter eats adjacent whitespace and newlines: `{{- ` strips to the left, ` -}}` strips to the right. The intent is to keep control logic (`if`/`range`/`end`) from leaving blank lines in the output.

The gotcha: `-}}` keeps stripping all the way to the next non-whitespace character, including newlines you actually wanted to keep. If a multi-line block of control logic ends every line with `-}}`, the real content right after it gets glued onto the previous line.

Example usage:
> A trailing `{{- end -}}` ate the newline after it, so the next line's TOML header `[data]` got glued to the end of the previous line's comment, and the whole line was read as a comment. Kept the newline by dropping the trailing `-`, writing `{{- end }}` instead.

## Related
- [[chezmoi]]
- [[2026-06-29-chezmoi-platform-template-breaks-decryption]]
