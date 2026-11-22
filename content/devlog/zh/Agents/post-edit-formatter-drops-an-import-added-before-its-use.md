---
type: agent-lesson
date: 2026-09-06
tags: [claude-code, hooks, python, ruff]
---
# 编辑后 formatter hook 对未使用 import 的移除

**错误**：第一轮编辑在 `repositories/workspaces.py` 的 import 行加了 `ModelRun, OptimizationRun`，几秒后第二轮编辑补上使用它们的函数。随后跑测试报 `NameError: name 'ModelRun' is not defined`，报错位置离 import 很远。

![首次使用落地前，编辑后运行的 Ruff 钩子删掉未使用的导入，下一次编辑因此触发 NameError。](../Diagrams/post-edit-formatter-drops-an-import-added-before-its-use.import-timing.svg)

**根因**：仓库的 PostToolUse hook 在每次 `Edit` 或 `Write` 后跑 `ruff check --fix` 和 `ruff format`。两轮编辑之间 import 还没被用到，ruff 的 F401 自动修复直接把它删了。唯一线索是 harness 提示「PostToolUse hook modified the file after your edit」，看着像无害的格式化。

**以后的规则**：
- import 和首次使用放进同一次 `Edit` 或同一个 patch 脚本，别拆成两次工具调用。
- 在带 hook 的仓库连续编辑多次后，跑测试前先 grep 一眼 import 行：`grep -n "^from ..models import" <file>`。
- 确定已经 import 的符号报 `NameError`，先怀疑 hook，再怀疑代码。

**来源**：▒▒▒▒▒▒▒▒（完整案例，含排查弯路）。
