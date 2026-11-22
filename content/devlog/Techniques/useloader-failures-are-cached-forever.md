---
type: trick
date: 2026-07-13
tags: [react, three, frontend]
---
# useLoader failures are cached forever

[[R3F]]'s `useLoader` is built on suspend-react underneath. A load failure stays in the module-level cache forever, and subsequent calls with the same key synchronously re-throw the old error. Building a "retry" requires clearing the cache first, then resetting the boundary state:

![A reset alone rethrows the cached loader error. Clear the matching useLoader entry before resetting the error boundary.](../Diagrams/useloader-failures-are-cached-forever.retry-cache.svg)

```tsx
useLoader.clear(STLLoader, url);   // clear this [loader, url] key first
setState({ hasError: false });     // only now does a re-render trigger an actual refetch
```

## Related

- [[2026-07-13-stl-viewer-retry-button-does-nothing]]
