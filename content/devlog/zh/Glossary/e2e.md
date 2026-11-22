---
type: glossary
tags: [glossary, testing]
---
# e2e

**全称**：End-to-End (testing)

端到端测试，从用户能看到的入口（真实浏览器、真实点击和输入）出发，跑完整条链直到拿到最终结果。单测只隔离测函数或组件。e2e 能确认「整条链真的跑得通」，代价是跑得慢，也更容易受无关改动影响。

![Playwright 在浏览器里打开自选列表抽屉，走完整个界面路径后核对可见结果。](../Diagrams/e2e.user-to-outcome.svg)

用例：

> UI 改完跑 Playwright e2e 套件，确认新设置对话框和 watchlist 抽屉从头到尾还能用。

## 相关

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
