---
type: moc
tags: [moc, debug, design, method]
---
# 调试与设计方法

23 篇笔记，记录可复用、不专属于某次事故的做法。各专题索引负责串案例，这里串方法。

![调试缩小可疑范围，验证对照相同证据，设计将规则放到负责它的边界。](../Diagrams/debugging-and-design-method.mechanism-groups.svg)

## 排查范围的收窄

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]：把嫌疑范围反复减半，直到只剩 1 处改动。
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]：同样的办法用在 commit 历史。
- [[zh/Techniques/comment-bisection-to-locate-a-crash|comment-bisection-to-locate-a-crash]]：同样的办法用在单个文件内。
- [[zh/Glossary/bisect|bisect]]

## 修复前后的验证

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]：先看现象，再提出假设并找证据，每次只改 1 处。
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]：没有复现，修复就只能靠猜。
- [[zh/Techniques/baseline-diff-verification-on-a-red-baseline|baseline-diff-verification-on-a-red-baseline]]：基线已有失败时，每个 commit 之后都比对退出状态和失败清单。
- [[zh/Techniques/read-the-last-stack-trace-line-first|read-the-last-stack-trace-line-first]]：先找离故障最近的栈帧。
- [[zh/Glossary/repro|repro]] · [[zh/Glossary/RCA|RCA]]

## 可见的失败

- [[zh/Techniques/log-placement|log-placement]]：在边界和作判断的地方记日志，不用每行都记。
- [[zh/Cases/Debug/2026-10-16-requested-values-empty-after-pair-translation|2026-10-16-requested-values-empty-after-pair-translation]]：两句平移指令完全相同，只取单个匹配的解析返回 `requested = null`，偏差检查就跳过去了。

## 设计取舍

- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]：边界跟着变更频率和归属走。
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]：做眼下确有需求的东西。
- [[zh/Cases/Design/2026-10-15-structure-run-parallelism-capacity|2026-10-15-structure-run-parallelism-capacity]]：首次使用时写入资源池容量，改 N 会报 `EXECUTION_RESOURCE_CONFIG_CHANGED`。新增 `set-capacity` CLI，有许可还在占用时拒绝修改，`runs_ahead` 按 N 个 slot 算。
- [[zh/Cases/Design/2026-10-24-yahoo-request-budget-and-daily-bar-store|2026-10-24-yahoo-request-budget-and-daily-bar-store]]：按时段批处理、用 Redis 存 180 个 symbol 的日线、约定公开缓存 key，每天行情请求从约 21,600 降到约 1,250。
- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]：在复制环节脱敏，合并匹配范围后遮盖，用输出的 10 种视图兜底检查，并区分词级和叙事级敏感内容。

## 可恢复的多步流程

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：冻结快照、持久保存 id、放弃前查服务端，重试就不会创建第二个对象。
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]：客户端手里的 id 决定服务端可能持有的上限。
- [[zh/Cases/Design/2026-10-24-plaid-item-removal-retry-after-verification|2026-10-24-plaid-item-removal-retry-after-verification]]：删除成功前保留 access token。孤儿队列尝试 3 次，遇永久 4xx 放弃，每轮审查都找出上一版修法的缺陷。

## 互相等待的资源池

- [[zh/Cases/Debug/2026-11-05-requests-hang-then-fail-in-500-batches|2026-11-05-requests-hang-then-fail-in-500-batches]]：同步路由在 teardown 归还连接，teardown 又需要 worker 线程。突发请求让线程池和连接池死锁，直到 `pool_timeout`。
