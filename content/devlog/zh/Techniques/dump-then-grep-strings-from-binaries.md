---
type: trick
date: 2026-07-25
tags: [shell, debug, reverse-engineering]
---
# 二进制字符串的导出与搜索

想查几十 MB 的原生二进制里某段字符串的上下文，别直接用 `grep -a`。回溯型正则扫原始二进制，少说也要几分钟。先用 `strings` 导出文本文件，后续每次查询不到一秒，还可以用 `-A` / `-B` 看上下文，随便调整模式。

![一次提取可打印字符串后，后续 grep 直接查文本，无需反复扫描二进制。](../Diagrams/dump-then-grep-strings-from-binaries.reusable-dump.svg)

BRE/ERE 的 `{n}` 上限还是 255。`grep -oE ".{280}<pattern>"` 会直接报 `maximum repetition exceeds 255`。碰到这个也该换成先导出再用 `-B`。

```bash
strings -n 6 ./some-binary > "$TMPDIR/bin.strings"   # once, a few seconds
grep -n -B4 "string you're looking for" "$TMPDIR/bin.strings"   # every query after that
grep -o -E 'function myFunc.{0,250}' "$TMPDIR/bin.strings"
```

对打包的 JS 尤其好用，比如用 bun/deno 编译的二进制。源码还以完整字符串留在里面，函数体和三元表达式都能直接看。

## 相关

- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[zh/Cheatsheets/search|search]]
