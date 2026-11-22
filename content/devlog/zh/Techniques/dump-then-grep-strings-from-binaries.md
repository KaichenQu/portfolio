---
type: trick
date: 2026-07-25
tags: [shell, debug, reverse-engineering]
---
# 二进制字符串的导出与搜索

查几十 MB 原生二进制里某段字符串的上下文，别直接拿 `grep -a` 扫。回溯型正则对着原始二进制跑，动辄几分钟。先用 `strings` 导成文本文件，后面每次查都不到一秒，还能用 `-A` / `-B` 看上下文、随时调匹配模式。

![一次提取可打印字符串后，后续 grep 直接查文本，无需反复扫描二进制。](../Diagrams/dump-then-grep-strings-from-binaries.reusable-dump.svg)

BRE/ERE 的 `{n}` 上限是 255，`grep -oE ".{280}<pattern>"` 会直接报 `maximum repetition exceeds 255`，碰到这报错也该改走导出加 `-B`。

```bash
strings -n 6 ./some-binary > "$TMPDIR/bin.strings"   # once, a few seconds
grep -n -B4 "string you're looking for" "$TMPDIR/bin.strings"   # every query after that
grep -o -E 'function myFunc.{0,250}' "$TMPDIR/bin.strings"
```

对打包的 JS（比如 bun/deno 编译出的二进制）尤其好用，源码以完整字符串留在里面，函数体和三元表达式直接可读。

## 相关

- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[zh/Cheatsheets/search|search]]
