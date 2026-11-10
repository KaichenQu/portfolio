---
type: case-debug
date: 2026-01-02
tags: [debug, frontend, cache]
status: solved
project: secret-project
links: [PR #1]
---
# Widget cache goes stale

The widget showed old data after a refresh; see [[retry-with-backoff]] and [[ETag|entity tag]] for background. Replace <file> with the path.

## Root cause

==The cache key ignored the `locale` field== so every locale shared one entry. A missing link: [[not-written-yet]].

```bash
echo "[[ETag]] and ==not a highlight== stay as typed <id>"
```

Inline `[[ETag]]` and `==x==` stay literal too.

```mermaid
flowchart LR
  A[client] -->|read| B[(cache)]
```

### Fix steps

| Step | Note |
|---|---|
| 1 | see [[ETag]] |

![flow](../../Diagrams/2026-01-02-widget-cache-goes-stale.flow.svg)
