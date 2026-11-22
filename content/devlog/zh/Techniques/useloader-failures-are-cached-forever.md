---
type: trick
date: 2026-07-13
tags: [react, three, frontend]
---
# useLoader 会永久缓存加载失败

[[zh/Glossary/R3F|R3F]] 的 `useLoader` 底层走 suspend-react。加载失败会永久留在模块级缓存里，此后同一 key 每次调用都会同步重抛旧错误。做「重试」必须先清缓存，再重置错误边界状态：

![先清除 STLLoader 缓存条目，再重置错误边界，才会真正发起重新请求。](../Diagrams/useloader-failures-are-cached-forever.retry-cache.svg)

```tsx
useLoader.clear(STLLoader, url);   // clear this [loader, url] key first
setState({ hasError: false });     // only now does a re-render trigger an actual refetch
```

## 相关

- [[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]
