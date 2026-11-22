---
type: agent-lesson
date: 2026-09-06
tags: [claude-code, hooks, python, ruff]
---
# 编辑后 formatter hook 对未使用 import 的移除

**错误**：第一次编辑在 `repositories/workspaces.py` 的 import 行加了 `ModelRun, OptimizationRun`。几秒后的第二次编辑加上使用它的函数。随后测试报 `NameError: name 'ModelRun' is not defined`，报错的测试离 import 很远。

![首次使用落地前，编辑后运行的 Ruff 钩子删掉未使用的导入，下一次编辑因此触发 NameError。](../Diagrams/post-edit-formatter-drops-an-import-added-before-its-use.import-timing.svg)

**根因**：仓库的 PostToolUse hook 在每次 `Edit` 或 `Write` 后跑 `ruff check --fix` 和 `ruff format`。两次编辑之间 import 没有使用，ruff 的 F401 自动修复就删了它。唯一信号是 harness 的提示「PostToolUse hook modified the file after your edit」，看起来只是无害的格式调整。

**以后的规则**：
- import 和首次使用放在同一次 `Edit` 或同一个 patch 脚本里，别拆成两次工具调用。
- 有 hook 的仓库连续做了多次编辑后，跑测试前 grep 一下 import 行：`grep -n "^from ..models import" <file>`。
- 确定 import 过的符号报 `NameError`，先怀疑 hook，再怀疑代码。

**来源**：▒▒▒▒▒▒▒▒（完整案例，含排查弯路）。
