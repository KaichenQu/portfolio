---
type: trick
date: 2026-06-20
tags: [debug]
---
# 修复前复现，修复后原样验证

动代码之前，先确认能稳定触发 bug（[[zh/Glossary/repro|repro]]）。改完把完全相同的步骤再走一遍，确认确实从坏变好了。

![用完全相同的复现步骤比较两次结果，修复前出现故障，修复后同一路径恢复正常。](../Diagrams/reproduce-before-fixing-verify-after.same-steps.svg)

省掉这一步，就分不清真修好了还是它本来就时有时无。这一步不能省。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Glossary/repro|repro]]
