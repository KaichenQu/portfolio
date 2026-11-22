---
type: case-debug
date: 2026-07-13
tags: [debug, frontend, react, three]
status: solved
---
# STL 查看器的重试按钮点了没用

## 现象

给 demo-v0.2 的 Three.js STL 查看器加错误处理时引入了 bug。后端没启动，几何数据加载失败，错误边界正常显示错误卡片。但用户把后端启动后点「重试」，卡片一闪就回来了，也没有发出新请求。

这次没在浏览器里看到 bug。代码审查时读依赖源码推断出问题，修完也用同样的方式验证，因为当时没有浏览器自动化可用。

## 复现

1. 前端开在 3000，8000 上的后端还没启动。
2. 进入几何查看步骤，`useLoader(STLLoader, url)` 失败，显示错误卡片。
3. 启动后端，点「重试」。卡片闪一下又出现，Network 面板没有新的几何数据请求。

## 排查过程

1. 整个分支最终审查时，发现 `StlViewer` 完全没处理错误：`useLoader` 在 `<Suspense>` 内抛出真实错误（Suspense 只捕获 promise），整棵树没有错误边界，最后落到 Next.js 默认错误页。问题记为 Important，要求提供回退界面。

2. 第一次修复（commit `67897d0`）：用类组件 `StlErrorBoundary` 包住 `<Canvas>`。回退卡片有「重试」按钮，onClick 只调用 `this.setState({ hasError: false })`。`pnpm lint`、`pnpm test`（11 项）和 `pnpm build` 全绿。

3. 复审时怀疑重试能不能真恢复。我没跑浏览器，直接读已安装的依赖：`@react-three/fiber` 的 `useLoader` 基于 **suspend-react**，缓存是模块级数组 `globalCache`。关键是这两行：

   ```js
   // suspend-react@0.1.3 index.js:59 — a failed result is written into the cache permanently, with no matching remove
   .catch(error => entry.error = error)
   // index.js:26 — a later lookup on the same key synchronously re-throws the cached error
   if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error;
   ```

   成功路径会按存活时间淘汰缓存，但==错误路径根本没有淘汰机制==。链路是 `setState` 触发重新渲染 → `Model` 再调 `useLoader(STLLoader, url)`（key 还是 `[STLLoader, url]`）→ 命中缓存，同步抛出旧错误 → 错误边界立刻调用 `getDerivedStateFromError`。重试按钮只重置了 React 状态，底层副作用（fetch）没再发生。

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

4. 找恢复入口。`useLoader` 自带 `useLoader.clear(loader, input)`，内部会构造同样的 `[STLLoader, url]` key，找到对应条目后调用 `entry.remove()`。错误边界要用它就得拿到 `url`，原先它只收 `children`，所以要把 `url` 显式传成 prop。

5. 第二次修复（commit `1082f76`）后核对三件事：clear 和 setState 的顺序（点击处理函数先同步执行 clear）；修改密度导致 url 变化时，外层 `<StlViewer key={url}>` 会重新挂载整棵树，错误边界的 `url` prop 和 `Model` 的 `url` 来自同一轮渲染里的同一个变量，所以不可能错误边界拿着旧 url，`Model` 却加载新 url；lint / test / build 重跑仍然全绿。

## 根因

suspend-react 会**永久**缓存 promise 的失败结果。一旦写了 `entry.error` 就没有淘汰途径，此后相同 key 的每次调用都同步抛出缓存里的错误。重置 React 组件状态清不掉模块级缓存，所以「重试」只是让错误边界马上再捕获同一个错误。

## 修复

从 `components/viz/StlViewer.tsx:18` 开始的 `StlErrorBoundary` 加上 `url: string` prop。`components/viz/StlViewer.tsx:34` 的重试 onClick 先清缓存，再重置状态：

```tsx
onClick={() => {
  // suspend-react caches failures forever; without clearing, useLoader re-throws the same error immediately
  useLoader.clear(STLLoader, this.props.url);
  this.setState({ hasError: false });
}}
```

不用「改 key 强制重挂载」的方案，那会丢掉 Canvas 和相机状态，而且没清缓存的话，新实例用同样的 key 还是会命中旧错误。

## 经验

- 错误恢复界面光重置 UI 状态不够，要确认**底层副作用确实重新执行**。用 Suspense 或缓存的数据源（useLoader、各类 suspense query 库），错误会不会缓存、怎么清除，都要看源码才能确定。
- lint / test / build 全绿也完全看不出这类 bug。没有测试覆盖这个组件，类型系统也看不到运行时缓存的行为。第一次修复提交时，这三项都是绿的。
- 想知道库到底怎么跑，读 `node_modules` 里实际装的版本。这样比查文档快，也更准确；文档很少写错误缓存的细节。
- 简记见 [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]。

## 相关

- [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]
- [[zh/Glossary/R3F|R3F]]
- [[zh/Glossary/regression|regression]]
