---
type: agent-lesson
date: 2026-11-21
tags: [frontend, playwright, ci, testing]
---
# 关掉触屏模拟后的指针媒体查询因平台而异

**错误**：两条新写的 Playwright 测试在 macOS 的全量测试里通过，到 Linux arm64 的 CI runner 上失败。一条通过 DevTools 协议开关触屏模拟，等 `(hover: hover) and (pointer: fine)` 这条查询第二次触发 `change`。另一条把 `#root` 非空当成 React 已经挂载，然后点击并数 ripple：期望 1，实际 0。PR 检查只跑 smoke 子集，两条都进了集成分支。

![结束触摸模拟后，macOS 恢复精细指针媒体状态，Linux 无头浏览器仍报告 none，因此等不到第二次 change 事件。](../Diagrams/pointer-media-after-touch-emulation-differs-on-linux-headless.pointer-state.svg)

**根因**：
- 触屏模拟关掉后，Linux 上的无头 Chromium 报 `hover: none`、`pointer: none`，macOS 会回到 `hover: hover`、`pointer: fine`。Linux 上第二次 `change` 事件不会触发。
- 入口文件在异步的配置请求返回之前先往 `#root` 写了占位内容，所以 `#root` 非空的时候应用还没挂载。

**以后的规则**：
- 能力切换用 Playwright 在每个平台都能模拟的媒体特性来驱动：在 `page.addInitScript` 里把 hover 和 pointer 查询映射到 `prefers-contrast`，再用 `page.emulateMedia` 切换。粗指针路径另留一条测试，用真实的触屏 context。
- 等应用挂载后才渲染出来的东西，不要等根元素有子节点。
- 新写的指针、悬停、触屏测试，先在 CI 平台上跑过再报完成。同一台机器上的 Playwright Linux 容器能复现这类失败。
- PR 检查只跑子集的仓库，先找到触发全量测试的事件（这里是推送到 `integration/**`），发布合并前读那次运行的结果。
