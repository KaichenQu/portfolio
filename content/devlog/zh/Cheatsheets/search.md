---
type: cheatsheet
tags: [cheatsheet, search]
---
# 代码搜索速查表

在不熟悉的代码库里找东西放在哪、谁在用。

![用 rg 找文本出现位置，用 fd 找文件名，用 ast-grep 找解析后的语法结构。](../Diagrams/search.search-target.svg)

## ripgrep（rg）内容搜索

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

## fd 文件搜索

```bash
fd <partial-name>              # find files by name, simpler and faster than find
fd -e ts                       # by extension
fd -t d <name>                 # directories only
```

## ast-grep（sg）语法结构搜索

它查的是代码结构，比按文本跑正则更精准。

```bash
sg -p 'console.log($A)'        # find all console.log calls, $A is a wildcard
sg -p 'await $A' -l ts
```

## 定义与用法

- 从 `rg -w "function-name"` 开始，先看所有出现位置。
- 定义处通常是 `function name`、`def name`、`const name =` 或 `class name`。
- 匹配太多时，用 `-t` 限定语言，或用 `-g` 排除测试和构建产物。

## 相关

- [[zh/Cheatsheets/process-network|process-network]]
