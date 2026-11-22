---
type: glossary
tags: [glossary, infra]
---
# GC

**全称**：Garbage Collection

垃圾回收，泛指自动收回不再需要的资源。除了语言运行时回收内存，平时也用来指磁盘上的定期清理，比如缓存目录、会话记录、日志和临时文件。要不要加 GC 就看两件事：资源本身有没有上限，不清会不会真出问题。

![附件缓存已有 512 MB 上限，无需额外清理，而无上限的会话目录会持续增长。](../Diagrams/gc.cleanup-decision.svg)

用例：

> 附件缓存有 `enforceCacheMaxBytes` 兜底，512 MB 封顶，不用另加 GC。kimi 的会话目录根本没上限，5 天涨了 13 MB，真该清的是这里。

## 相关

- [[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]
- [[zh/Glossary/TTL|TTL]]
