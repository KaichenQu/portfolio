---
type: agent-lesson
date: 2026-07-13
tags: [react, frontend, error-handling]
---
# A retry button must re-trigger the side effect, not just reset UI state

**Mistake**: Added an error boundary around an R3F `useLoader(STLLoader, url)` viewer with a retry button whose onClick only did `setState({hasError: false})`. Shipped it with lint/tests/build all green. The button was non-functional: the error card flashed and reappeared, and no new request was ever issued.

**Root cause**: `useLoader` is built on suspend-react, whose module-level cache stores a failed promise's error permanently (`entry.error = error`, no eviction on the error path) and synchronously re-throws it for every later call with the same `[loader, url]` key. Resetting React component state does not invalidate that external cache.

**Rule going forward**:
- When building any error-recovery affordance (retry button, reconnect, refresh), trace what actually re-executes the failed side effect. If the data source is a Suspense/cache library, read the installed source in `node_modules` to check whether errors are cached and how to evict them (`useLoader.clear(loader, input)` here) — docs rarely state error-cache semantics.
- Do not treat green lint/test/build as evidence a recovery path works; if no test exercises it and you cannot drive a browser, verify by reading the library's cache implementation and say so in the report.

**Source**: [[2026-07-13-stl-viewer-retry-button-does-nothing]] (full case, with the investigation timeline).
