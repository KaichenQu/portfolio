---
type: case-debug
date: 2026-07-13
tags: [debug, frontend, react, three]
status: solved
---
# STL 查看器的重试按钮点了没用

## 现象

给 demo-v0.2 的 Three.js STL 查看器加错误处理时引入了个 bug。后端没起，几何数据加载失败，错误边界正常切到错误卡片；但启动后端后再点「重试」，卡片闪一下又弹回来，也没有发出新请求。

这个 bug 没在浏览器里亲眼看到。代码审查时翻依赖源码推断出来，修完也按同样的方式验证，当时没有浏览器自动化可用。

## 复现

1. 前端开在 3000，8000 上的后端不启动。
2. 进入几何查看步骤，`useLoader(STLLoader, url)` 失败，页面显示错误卡片。
3. 启动后端，点「重试」。卡片闪一下又回来，Network 面板没有新的几何数据请求。

## 排查过程

1. 整个分支最终审查时，发现 `StlViewer` 根本没做错误处理：`useLoader` 在 `<Suspense>` 里抛出真实错误（Suspense 只接 promise），整棵树又没有错误边界，最后直接掉到 Next.js 默认错误页。问题记为 Important，要求补回退界面。

2. 第一次修复（commit `67897d0`）：写类组件 `StlErrorBoundary` 包住 `<Canvas>`。回退卡片带「重试」按钮，onClick 里只调了 `this.setState({ hasError: false })`。`pnpm lint`、`pnpm test`（11 项）和 `pnpm build` 全绿。

3. 复审时怀疑重试能不能真的恢复。没起浏览器，直接看装在本地的依赖源码：`@react-three/fiber` 的 `useLoader` 基于 **suspend-react**，缓存放在模块级数组 `globalCache` 里。看这两行：

   ```js
   // suspend-react@0.1.3 index.js:59 — a failed result is written into the cache permanently, with no matching remove
   .catch(error => entry.error = error)
   // index.js:26 — a later lookup on the same key synchronously re-throws the cached error
   if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error;
   ```

   成功路径会按存活时间淘汰缓存，==错误路径完全没有淘汰机制==。调用链是：`setState` 触发重渲染 → `Model` 再调 `useLoader(STLLoader, url)`（key 还是 `[STLLoader, url]`）→ 命中缓存，同步抛出旧错误 → 错误边界立刻触发 `getDerivedStateFromError`。重试按钮只重置了 React 状态，底层的 fetch 根本没再发。

   ```mermaid
   flowchart TB
     A["点重试"] --> B["setState hasError=false"]
     B --> C["重新渲染 Model"]
     C --> D["useLoader(STLLoader, url)"]
     D --> E{"命中 globalCache？"}
     E -->|"entry.error 还在"| F["同步抛出旧错误"]
     F --> G["错误边界再次捕获<br/>错误卡片重新出现"]
     E -->|"clear 已清除条目"| H["重新开始加载"]
     classDef bad fill:#7f1d1d,color:#fff
     class F bad
   ```

4. 找清缓存的入口。`useLoader` 自带 `useLoader.clear(loader, input)`，内部拼出同样的 `[STLLoader, url]` key，找到对应条目调 `entry.remove()`。错误边界要调它就得拿到 `url`，原来它只接 `children`，需要把 `url` 作为 prop 显式传进去。

5. 第二次修复（commit `1082f76`）后核对了三件事：clear 和 setState 的顺序（点击回调里先同步跑 clear）；改密度导致 url 变化时，外层 `<StlViewer key={url}>` 会重挂整棵树，错误边界和 `Model` 的 `url` 来自同一轮渲染的同一个变量，不会出现错误边界拿旧 url、`Model` 加载新 url 的错位；重跑 lint / test / build 依然全绿。

## 根因

suspend-react 会**永久**缓存失败的 promise 结果。写进 `entry.error` 后没有淘汰路径，此后相同 key 的每次调用都会同步重抛缓存里的错误。重置 React 组件状态清不掉模块级缓存，点「重试」只是让错误边界立刻再接住同一个错误。

## 修复

从 `components/viz/StlViewer.tsx:18` 开始的 `StlErrorBoundary` 加上 `url: string` prop；`components/viz/StlViewer.tsx:34` 的重试 onClick 先清缓存，再重置状态：

```tsx
onClick={() => {
  // suspend-react caches failures forever; without clearing, useLoader re-throws the same error immediately
  useLoader.clear(STLLoader, this.props.url);
  this.setState({ hasError: false });
}}
```

没用「改 key 强制重挂」的方案：那样会丢掉 Canvas 和相机状态，而且不清缓存的话，新实例用同样的 key 照样命中旧错误。

## 经验

- 错误恢复界面不能只重置 UI 状态，要确认**底层副作用真的会重新执行**。凡是带 Suspense 或缓存的数据源（useLoader、各类 suspense query 库），错误会不会缓存、怎么清，都要看源码确认，不能靠猜。
- lint / test / build 全绿也完全看不出这类 bug。没有测试覆盖这个组件，类型系统也看不见运行时的缓存语义。第一次修复提交时三项全绿。
- 想知道库到底怎么跑，直接读 `node_modules` 里实际装的版本。比翻文档更快更准，文档很少写错误缓存的细节。
- 简记见 [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]。

## 相关

- [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]
- [[zh/Glossary/R3F|R3F]]
- [[zh/Glossary/regression|regression]]
