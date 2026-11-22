---
type: glossary
tags: [glossary, backend]
---
# TTL

**全称**：Time To Live

缓存数据从写入到过期的时长。过了 TTL，下次读取要么返回空，要么重新拉取，用来在「数据新鲜度」和「少发上游请求」之间取舍。

![相同一批 /api/spark 请求在十分钟内读取内存缓存，到期后的读取可重新获取数据。](../Diagrams/ttl.cache-expiry.svg)

用例：

> `/api/spark` 的结果放在内存缓存里，TTL 是 10 分钟。这段时间请求同批 symbol 直接命中缓存，不再调 Yahoo 的 API。

## 相关

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[zh/Glossary/p99|p99]]
