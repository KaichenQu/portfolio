---
type: trick
date: 2026-07-25
tags: [shell, debug, reverse-engineering]
---
# Dump strings from a binary before grepping them

To find the context around a string inside a native binary that's tens of megabytes, don't `grep -a` it directly — a backtracking regex against raw binary data slows to minutes at best. Run `strings` once to dump it to a text file; every query after that is sub-second, and you can use `-A`/`-B` for context and iterate on the pattern freely.

Also, BRE/ERE caps `{n}` at 255 — `grep -oE ".{280}<pattern>"` fails outright with `maximum repetition exceeds 255`. That's another sign to switch to dump + `-B`.

```bash
strings -n 6 ./some-binary > "$TMPDIR/bin.strings"   # once, a few seconds
grep -n -B4 "string you're looking for" "$TMPDIR/bin.strings"   # every query after that
grep -o -E 'function myFunc.{0,250}' "$TMPDIR/bin.strings"
```

Especially useful for bundled JS (bun/deno compiled binaries): the source stays in the binary as complete strings, so you can read function bodies and ternary expressions straight out of it.

## Related
- [[2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[search]]
