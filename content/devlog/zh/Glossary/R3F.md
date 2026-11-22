---
type: glossary
tags: [glossary]
---
# R3F

**全称**：react-three-fiber（`@react-three/fiber`）
**类别**：Three.js 的 React 渲染器

把 Three.js 场景写成 React 组件树（`<Canvas>`、`<mesh>` 等），由 reconciler 同步成 Three.js 对象。资源通过 `useLoader` 加载，底层用 suspend-react 的模块级缓存，搭配 `<Suspense>` 显示加载状态。失败也存在同一个缓存里，见链接里的案例。通常搭配 `@react-three/drei` 这套工具组件。

![R3F 的 useLoader 会缓存资源加载错误，由外层错误边界捕获，Suspense 负责加载中的回退界面。](../Diagrams/r3f.loader-result.svg)

用例：

> R3F 的 `useLoader` 抛出的错误要让外层错误边界接住。Suspense 自己不处理真实错误。

## 相关

- [[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]
- [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]
