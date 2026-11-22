---
type: agent-lesson
date: 2026-07-13
tags: [react, frontend, error-handling]
---
# 重试按钮的 UI 状态与副作用

**错误**：给 R3F `useLoader(STLLoader, url)` 的查看器加错误边界，重试按钮的 onClick 只做 `setState({hasError: false})`。lint/tests/build 全绿后就交了。按钮实际没用：错误卡片闪一下就回来，从来没有发出新请求。

![重置 hasError 后 useLoader 的失败条目仍在缓存中，清除它才会重新执行加载。](../Diagrams/retry-ui-must-evict-suspense-error-cache.side-effect-retry.svg)

**根因**：`useLoader` 底层是 suspend-react。模块级缓存永久保存失败 promise 的错误（`entry.error = error`，错误路径没有淘汰机制），随后每次用同一 `[loader, url]` key 调用都会同步重抛。重置 React 组件状态清不掉外部缓存。

**以后的规则**：
- 做错误恢复入口时（重试按钮、重连、刷新），追到真正让失败的副作用重新执行的地方。数据源用了 Suspense 或缓存库，就读 `node_modules` 里实际安装的源码，查错误会不会缓存、怎么淘汰（这里用 `useLoader.clear(loader, input)`）。文档很少写错误缓存的行为。
- lint/test/build 全绿证明不了恢复路径能用。没有测试覆盖，又没法操作浏览器时，就读库的缓存实现验证，并在报告写明。

**来源**：[[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]（完整案例，含排查时间线）。
