---
type: agent-lesson
date: 2026-11-21
tags: [frontend, playwright, ci, testing]
---
# 关掉触屏模拟后的指针媒体查询因平台而异

**错误**：两条新写的 Playwright 测试在 macOS 全量里通过了，到 Linux arm64 的 CI runner 上失败。一条用 DevTools 协议开关触屏模拟，等 `(hover: hover) and (pointer: fine)` 第二次发 `change`；另一条把 `#root` 非空当成 React 已挂载，点击后数 ripple：期望 1，实际 0。PR 检查只跑 smoke 子集，两条都漏进了集成分支。

![结束触摸模拟后，macOS 恢复精细指针媒体状态，Linux 无头浏览器仍报告 none，因此等不到第二次 change 事件。](../Diagrams/pointer-media-after-touch-emulation-differs-on-linux-headless.pointer-state.svg)

**根因**：
- 关掉触屏模拟后，Linux 无头 Chromium 报 `hover: none`、`pointer: none`，macOS 则回到 `hover: hover`、`pointer: fine`，所以 Linux 上第二次 `change` 不会触发。
- 入口文件在异步配置请求返回前先往 `#root` 写了占位内容，`#root` 非空时应用还没挂载。

**以后的规则**：
- 能力切换改用 Playwright 跨平台都能模拟的媒体特性驱动：在 `page.addInitScript` 里把 hover 和 pointer 查询映射到 `prefers-contrast`，用 `page.emulateMedia` 切换。粗指针路径另留一条测试，用真实触屏 context。
- 等应用挂载后真正渲染出来的元素，别等根元素有子节点。
- 新写的指针、悬停、触屏测试，要在 CI 平台上跑通再报完成；同一台机器起 Playwright Linux 容器就能复现这类失败。
- PR 检查只跑子集的仓库，先查清触发全量测试的事件（这里是推到 `integration/**`），发布合并前先看那次运行结果。
