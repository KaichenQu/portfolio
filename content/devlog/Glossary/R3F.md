---
type: glossary
tags: [glossary]
---
# R3F

**Full name**: react-three-fiber (`@react-three/fiber`)
**Category**: React renderer for Three.js

Writes a Three.js scene as a React component tree (`<Canvas>`, `<mesh>`, etc.), synced to Three.js objects by a reconciler. Asset loading goes through `useLoader`, backed by suspend-react's module-level cache, paired with `<Suspense>` for the loading state — failures also land in that same cache (see the linked case). Commonly paired with `@react-three/drei` (a utility component set).

![React Three Fiber renders a React tree as Three.js objects. Its loader cache also stores failures, which propagate to an error boundary.](../Diagrams/r3f.loader-result.svg)

Example usage:
> Errors thrown by R3F's `useLoader` have to be caught by an outer error boundary — Suspense itself doesn't handle real errors.

## Related

- [[2026-07-13-stl-viewer-retry-button-does-nothing]]
- [[useloader-failures-are-cached-forever]]
