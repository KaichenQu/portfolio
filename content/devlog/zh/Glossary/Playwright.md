---
type: glossary
tags: [glossary, testing]
---
# Playwright

**全称**：Playwright（浏览器自动化库）

可以用代码操作真实 Chromium、Firefox 或 WebKit 浏览器的库和 CLI。能打开页面、点击、输入、读 DOM、截图和采集网络流量。可以写 [[zh/Glossary/e2e|e2e]] 测试，也能用脚本在 dev server 上检查页面。

![本地栈上的三轮并行 Playwright 验证共生成 20 张卡片、替换 10 张，并确认创建和提交响应丢失后可用原 ID 恢复。](../Diagrams/playwright.browser-evidence.svg)

用例：

> 对本地环境并行跑了 3 轮 Playwright，生成 20 张卡片、替换 10 张。create 和 submit 响应丢包时，用原来的 id 恢复。

## 相关

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Glossary/e2e|e2e]]
