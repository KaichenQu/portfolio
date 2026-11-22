---
type: glossary
tags: [glossary, backend]
---
# TTL

**Full name**: Time To Live

The duration from when a piece of cached data is written to when it expires. Past the TTL, the next read either returns empty or triggers a refetch — a way to balance "data freshness" against "fewer upstream requests."

![Time To Live bounds how long a cache entry is usable. Reads within the window return the cached value, while later reads miss or refetch.](../Diagrams/ttl.cache-expiry.svg)

Example usage:
> `/api/spark` results are cached in memory with a 10-minute TTL; within that window, requests for the same batch of symbols hit the cache directly instead of calling Yahoo's API.

## Related
- [[2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[p99]]
