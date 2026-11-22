---
type: trick
date: 2026-06-20
tags: [debug]
---
# 修复前复现，修复后原样验证

动代码前先确认能稳定触发 bug（[[zh/Glossary/repro|repro]]）。改完拿一模一样的步骤再跑一遍，确认确实从坏变好了。

![用完全相同的复现步骤比较两次结果，修复前出现故障，修复后同一路径恢复正常。](../Diagrams/reproduce-before-fixing-verify-after.same-steps.svg)

跳过这一步，就分不清是真修好了，还是它本来就时好时坏。这步省不得。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Glossary/repro|repro]]
