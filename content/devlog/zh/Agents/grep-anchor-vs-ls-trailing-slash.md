---
type: agent-lesson
date: 2026-07-08
tags: [shell, grep]
---
# `ls` 尾部斜线与正则行尾锚点的静默漏项

**错误**：跑 `ls <dir> | grep -iE "^default$|^profile"` 查 Chrome profile 目录，只出来一行 `Profile 3/`，就当成唯一且在用的 profile，在错前提上多查了两轮。

![Default/ 的尾斜杠使末尾锚定的表达式漏掉它，前缀表达式仍能找到 Profile 3/。](../Diagrams/grep-anchor-vs-ls-trailing-slash.silent-filter.svg)

**根因**：这里的 `ls` 会在目录名后加 `/`，跟 `eza`、`lsd` 一样。`^default$` 锚定行尾，`Default/` 永远匹配不上，悄无声息给滤掉了。`^profile` 没带 `$`，照常匹配 `Profile 3/`，输出结果看着既完整又合理。

**以后的规则**：
- 对 `ls`、`find` 或其他工具输出加行尾锚点 `$` 前，先看输出有没有尾随格式（末尾斜线、权限前缀、颜色码）；没确认行格式就别写 `$`。
- 过滤后结果比预期少（尤其只剩 1 条或 0 条）时，先去掉过滤重跑一遍。静默漏项和「本来就只有一项 / 这里没东西」看着一模一样。
- 工具自带机器可读参数（如 `--json`、`-1`）时优先用，少用管道 `grep`。在带装饰格式的文本上跑正则，最容易在末尾附加字符上出问题。

**来源**：[[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]（完整案例，含排查时间线）。
