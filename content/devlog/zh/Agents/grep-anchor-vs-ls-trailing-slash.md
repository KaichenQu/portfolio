---
type: agent-lesson
date: 2026-07-08
tags: [shell, grep]
---
# `ls` 尾部斜线与正则行尾锚点的静默漏项

**错误**：用 `ls <dir> | grep -iE "^default$|^profile"` 查 Chrome profile 目录。只得到一行（`Profile 3/`），就认定它是唯一且当前在用的 profile，又在这个错误前提上多查了两轮。

![Default/ 的尾斜杠使末尾锚定的表达式漏掉它，前缀表达式仍能找到 Profile 3/。](../Diagrams/grep-anchor-vs-ls-trailing-slash.silent-filter.svg)

**根因**：这里的 `ls` 在目录名后追加 `/`，和 `eza`、`lsd` 类似。`^default$` 锚定行尾，`Default/` 永远匹配不上，悄悄就滤掉了，毫无提示。`^profile` 不带 `$`，仍能匹配 `Profile 3/`，所以结果看起来完整又合理。

**以后的规则**：
- 对 `ls`、`find` 或其他工具输出用行尾锚点 `$` 前，先查输出有没有额外格式（末尾斜线、前置权限字段、颜色码）。没确认行格式就去掉 `$`。
- 过滤后结果比预期少，尤其只剩 1 条或 0 条时，先去掉过滤重跑。静默漏项和「只有一项」或「这里没东西」看起来完全一样。
- 有专门的输出参数就优先用，比如工具自带的 `--json` 或 `-1`，省去管道里的 `grep`。在带格式的文本上跑正则，最容易栽在末尾附加内容上。

**来源**：[[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]（完整案例，含排查时间线）。
