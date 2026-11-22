---
type: moc
tags: [moc, debug, design, method]
---
# 调试与设计方法

共 23 篇，收的都是能复用、不绑在某次事故上的做法。其他索引按专题串案例，这里只串方法。

![调试缩小可疑范围，验证对照相同证据，设计将规则放到负责它的边界。](../Diagrams/debugging-and-design-method.mechanism-groups.svg)

## 范围收窄

- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]：把嫌疑范围一再对半切，直到只剩 1 处改动。
- [[zh/Techniques/locating-regressions-with-git-bisect|locating-regressions-with-git-bisect]]：同一套办法，用在 commit 历史上。
- [[zh/Techniques/comment-bisection-to-locate-a-crash|comment-bisection-to-locate-a-crash]]：同一套办法，用在单个文件里。
- [[zh/Glossary/bisect|bisect]]

## 修复前后验证

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]：先看现象，再提假设、找证据，每次只改 1 处。
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]：复现不出来，修复就全靠猜。
- [[zh/Techniques/baseline-diff-verification-on-a-red-baseline|baseline-diff-verification-on-a-red-baseline]]：基线本来就有失败时，每个 commit 后都对照退出状态和失败清单。
- [[zh/Techniques/read-the-last-stack-trace-line-first|read-the-last-stack-trace-line-first]]：先看离故障最近的栈帧，不是最顶上的那帧。
- [[zh/Glossary/repro|repro]] · [[zh/Glossary/RCA|RCA]]

## 显性失败

- [[zh/Techniques/log-placement|log-placement]]：日志打在边界和分支判断处，不用逐行都记。
- [[zh/Cases/Debug/2026-10-16-requested-values-empty-after-pair-translation|2026-10-16-requested-values-empty-after-pair-translation]]：两条平移指令一模一样，只取单条匹配的解析返回 `requested = null`，偏差检查直接跳过。

## 设计取舍

- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]：边界跟着变更频率和归属走。
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]：只做眼下真用得上的。
- [[zh/Cases/Design/2026-10-15-structure-run-parallelism-capacity|2026-10-15-structure-run-parallelism-capacity]]：首次使用时把资源池容量存了下来，后面改 N 就报 `EXECUTION_RESOURCE_CONFIG_CHANGED`。加了 `set-capacity` CLI，还有许可占着就拒改，`runs_ahead` 按 N 个 slot 算。
- [[zh/Cases/Design/2026-10-24-yahoo-request-budget-and-daily-bar-store|2026-10-24-yahoo-request-budget-and-daily-bar-store]]：靠按时段批处理、Redis 存 180 个 symbol 的日线、约定公开缓存 key，把每天行情请求从约 21,600 压到约 1,250。
- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]：复制时脱敏，先合并命中范围再遮盖，拿输出的 10 种视图兜底检查，词级和叙事级敏感内容分开处理。

## 多步流程恢复

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：冻结快照、先把 id 存下来、放弃前查服务端，重试就不会多建出第二个对象。
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]：客户端手里留的 id，框住了服务端最多可能持有什么。
- [[zh/Cases/Design/2026-10-24-plaid-item-removal-retry-after-verification|2026-10-24-plaid-item-removal-retry-after-verification]]：删除成功前留着 access token；孤儿队列试 3 次，碰上永久 4xx 直接放弃，每轮审查都找出上一版修法的漏洞。

## 资源池死锁

- [[zh/Cases/Debug/2026-11-05-requests-hang-then-fail-in-500-batches|2026-11-05-requests-hang-then-fail-in-500-batches]]：同步路由在 teardown 里归还连接，teardown 又需要 worker 线程；突发请求把线程池和连接池一起锁死，直到 `pool_timeout`。
