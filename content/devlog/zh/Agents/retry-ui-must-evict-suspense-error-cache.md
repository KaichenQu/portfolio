---
type: agent-lesson
date: 2026-07-13
tags: [react, frontend, error-handling]
---
# 重试按钮的 UI 状态与副作用

**错误**：给 R3F `useLoader(STLLoader, url)` 查看器加了错误边界，重试按钮的 onClick 只写了一句 `setState({hasError: false})`。lint/tests/build 全绿就交付了。按钮其实根本没用：错误卡片闪一下又弹回来，从来没发过新请求。

![重置 hasError 后 useLoader 的失败条目仍在缓存中，清除它才会重新执行加载。](../Diagrams/retry-ui-must-evict-suspense-error-cache.side-effect-retry.svg)

**根因**：`useLoader` 底层用的是 suspend-react，模块级缓存会永久留着失败 promise 的错误（`entry.error = error`，错误路径不做淘汰），之后只要再用同一个 `[loader, url]` key 调用就会同步重抛。重置 React 组件状态清不掉这层外部缓存。

**以后的规则**：
- 写重试按钮、重连、刷新这类错误恢复入口，要一路追到真正重新执行副作用的地方。如果数据源走的是 Suspense 或缓存库，直接读 `node_modules` 里装的源码，看它会不会缓存错误、怎么清缓存（这里要调 `useLoader.clear(loader, input)`），文档很少写这一套。
- 别把 lint/test/build 全绿当成恢复路径能用的证据。要是没测试覆盖、也没法拉起浏览器，就读库的缓存实现来核对，并在报告里写明。

**来源**：[[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]（完整案例，含排查时间线）。
