---
type: case-debug
date: 2026-07-13
tags: [debug, frontend, react, three]
status: solved
publish: true
---
# The STL viewer's retry button does nothing when you click it

## Symptom

A bug introduced while adding error handling to demo-v0.2's Three.js STL viewer. With the backend down, geometry loading fails and the error boundary correctly falls back to an error card. But once the user starts the backend and clicks "Retry", the card blinks and comes straight back, and no new request is ever issued.

This bug was never observed in a browser. It was deduced during code review by reading the dependency's source, and the fixed behaviour was verified the same way — the session had no browser automation available.

## Reproduction

1. Frontend on 3000, backend on 8000 not started.
2. Enter the geometry viewing step; `useLoader(STLLoader, url)` fails and the error card appears.
3. Start the backend, click "Retry" — the card flickers and returns, and the Network panel shows no new geometry request.

## Investigation timeline

1. The final whole-branch review found that `StlViewer` had no error handling at all: `useLoader` throws a real error inside `<Suspense>` (Suspense only catches promises), there was no error boundary anywhere in the tree, and the failure escalated to Next.js's default error page. Filed as Important, with a fallback required.

2. First fix (commit `67897d0`): a class component `StlErrorBoundary` wrapping `<Canvas>`, with a fallback card carrying a "Retry" button whose onClick did nothing but `this.setState({ hasError: false })`. `pnpm lint`, `pnpm test` (11 tests), and `pnpm build` all green.

3. Re-review questioned whether retry actually recovers. Rather than running a browser, I read the source of the installed dependency: `@react-three/fiber`'s `useLoader` is built on **suspend-react**, whose cache is a module-level array, `globalCache`. Two lines matter:

   ```js
   // suspend-react@0.1.3 index.js:59 — a failed result is written into the cache permanently, with no matching remove
   .catch(error => entry.error = error)
   // index.js:26 — a later lookup on the same key synchronously re-throws the cached error
   if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error;
   ```

   The success path has a lifespan-based eviction mechanism; ==the error path has no eviction at all==. The chain: `setState` re-renders → `Model` calls `useLoader(STLLoader, url)` again (same `[STLLoader, url]` key) → the cache hits and synchronously re-throws the old error → the boundary's `getDerivedStateFromError` fires immediately. The retry button reset React state and nothing else; the side effect (the fetch) never happened again.

   ```mermaid
   flowchart TB
     A["Click Retry"] --> B["setState hasError=false"]
     B --> C["Re-render Model"]
     C --> D["useLoader(STLLoader, url)"]
     D --> E{"globalCache hit?"}
     E -->|"entry.error still present"| F["Synchronously throw old error"]
     F --> G["Boundary catches again<br/>error card reappears"]
     E -->|"entry removed by clear"| H["Load starts over"]
     classDef bad fill:#7f1d1d,color:#fff
     class F bad
   ```

4. Looking for a recovery mechanism: `useLoader` ships one, `useLoader.clear(loader, input)`, which builds the same `[STLLoader, url]` key internally and calls `entry.remove()` on the matching entry. To use it, the boundary needs the `url`, and the original implementation only accepted `children` — so `url` had to be threaded in as an explicit prop.

5. Three checks after the second fix (commit `1082f76`): the ordering of clear and setState (clear runs first, synchronously, inside the click handler); the case where changing density changes the url — the outer `<StlViewer key={url}>` remounts the whole tree, and the boundary's `url` prop and `Model`'s `url` come from the same variable in the same render, so there is no way for the boundary to hold a stale url while `Model` loads a new one; and lint / test / build re-run green.

## Root cause

suspend-react caches a failed promise result **permanently** — once `entry.error` is written there is no eviction path — and every later call on the same key synchronously re-throws that cached error. Resetting a React component's state does not invalidate that module-level cache, so the "Retry" button only causes the boundary to catch the same old error again, immediately.

## Fix

`StlErrorBoundary`, starting at `components/viz/StlViewer.tsx:18`, gained a `url: string` prop; the retry onClick at `components/viz/StlViewer.tsx:34` now clears the cache before resetting state:

```tsx
onClick={() => {
  // suspend-react caches failures forever; without clearing, useLoader re-throws the same error immediately
  useLoader.clear(STLLoader, this.props.url);
  this.setState({ hasError: false });
}}
```

No "change the key to force a remount" variant, because that throws away Canvas and camera state as well — and without clearing the cache, a new instance on the same key still hits the old error.

## Lessons

- Error-recovery UI cannot just reset UI state; you have to confirm that **the underlying side effect really re-executes**. For any data source built on Suspense or a cache (useLoader, the various suspense query libraries), whether errors are cached and how they are invalidated has to be read out of the source, not assumed.
- Green lint / test / build is completely blind to this class of bug: no test covered the component, and the type system cannot see runtime cache semantics. The first fix was committed with all three green.
- To learn a library's real behaviour, read the source of the version actually installed in `node_modules`. It is faster and more accurate than the docs, which rarely document error-cache semantics.
- Distilled to one line: [[useloader-failures-are-cached-forever]].

## Related

- [[useloader-failures-are-cached-forever]]
- [[R3F]]
- [[regression]]
