---
type: glossary
tags: [glossary, infra]
---
# GC

**Full name**: Garbage Collection

Broadly, automatic reclamation of resources no longer needed. Beyond a language runtime's memory reclamation, in day-to-day work it also means periodic cleanup on disk: cache directories, session records, logs, temp files. Deciding whether to add a GC pass comes down to two questions — does this thing already have its own cap, and would skipping cleanup actually cause a problem.

Example usage:
> The attachment cache has `enforceCacheMaxBytes` as a backstop, capped at 512 MB, so it needs no extra GC. kimi's session directory has no cap at all — 13 MB over 5 days — that's where cleanup actually belongs.

## Related
- [[2026-08-13-feishu-image-blocked-by-overbroad-guard]]
- [[TTL]]
