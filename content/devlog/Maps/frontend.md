---
type: moc
tags: [moc, frontend, react, css, three]
---
# Frontend

17 notes. The smallest cluster, and its threads are about state that outlives the render.

## Cached failure

A failed load that gets cached looks exactly like a UI bug, because the retry path never reaches the loader.

- [[2026-07-13-stl-viewer-retry-button-does-nothing]] — the case
- [[useloader-failures-are-cached-forever]] — R3F `useLoader` / suspend-react cache errors permanently
- [[retry-ui-must-evict-suspense-error-cache]] — resetting React state is not enough; evict the cache entry

## CSS ownership across agents

- [[2026-07-10-quiet-desk-redesign-four-parallel-agents]] — four agents, disjoint file sets, one shared class
- [[multi-agent-dead-code-deletion-needs-repo-wide-grep]] — file ownership says who writes a file, never who uses whose class

## Persisted client state across a multi-step chain

- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]] — the case: ids held in `sessionStorage` bound what the server can hold, so recovery and abandon read local state first
- [[persist-id-before-next-step]] — write each server id to durable storage before the request that depends on it

## Publishing private content

The browser can hide text but cannot remove it; redaction belongs where the text is copied.

- [[2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]] — the case: a private vault published to a public Next.js repo, masked at sync time with fail-closed checks, ten notes held back
- [[site-url-constant-is-not-proof-the-host-resolves]] — canonical, `og:image` and sitemap URLs built from a host with no DNS record

## Terms

- [[SPA]] · [[R3F]] · [[Idempotency key]] · [[Lease]] · [[Playwright]] · [[SEO]] · [[DNS]]
