---
type: cheatsheet
tags: [cheatsheet, search]
---
# Code search cheatsheet

For finding where something lives and who uses it, in an unfamiliar codebase.

## ripgrep (rg) — finding content
```bash
rg "<regex>"                   # recursive search, auto-skips .gitignore and binaries
rg -i "<word>"                 # case-insensitive
rg -w "<word>"                 # whole-word match, so "user" doesn't match "username"
rg "<word>" -t py              # search only one file type
rg "<word>" -g "!*.test.ts"    # exclude certain files
rg -l "<word>"                 # list matching filenames only, no matched lines
rg -A 3 -B 3 "<word>"          # 3 lines of context above and below each match
rg "<word>" -c                 # match count per file
```

## fd — finding files
```bash
fd <partial-name>              # find files by name, simpler and faster than find
fd -e ts                       # by extension
fd -t d <name>                 # directories only
```

## ast-grep (sg) — searching by syntax structure
More precise than regex — it searches code structure, not text.
```bash
sg -p 'console.log($A)'        # find all console.log calls, $A is a wildcard
sg -p 'await $A' -l ts
```

## Finding definitions and usages
- Start with `rg -w "function-name"` to see every occurrence.
- The definition site is usually `function name`, `def name`, `const name =`, or `class name`.
- Too many hits? Narrow with `-t` for language, or exclude tests and build output with `-g`.

## Related
- [[process-network]]
