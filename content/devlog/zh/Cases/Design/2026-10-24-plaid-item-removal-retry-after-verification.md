---
type: case-design
date: 2026-10-24
tags: [design, backend, go, retry, third-party-api]
status: solved
---
# Plaid Item 删除与验证后重试

KairoTrade 用 Plaid 连接验证用户账户，验完就不再需要这个连接，本该把它删掉。但到 10/24 为止一直没删过，每个验过的连接都在持续按月计费。

最终方案把 access token 留在服务端直到删除成功；删失败的进孤儿队列（orphan queue），总共最多试 3 次，撞上永久性 4xx 立刻放弃。==三轮评审，每一轮都在上一轮修法里挑出了新缺陷==，最后挑出的那个目前仍留着：队列在内存里。

下文用到的几个词：

- **Plaid**：把应用跟用户的银行或券商账户接起来的服务。
- **Item**：Plaid 对单条连接的记录，只要不删就按月收费。
- **access token**：应用为某条 Item 拿到的凭据，调 `/item/remove` 删 Item 必须带它。

## 背景与约束

第二次全仓库审计（main `2d4a7b3`）把它记为 should 级第 7 项：

```
internal/accounts/connection_security.go:155-159
internal/accounts/aggregators.go:88-99
```

- Plaid access token 只存内存。
- 条目 24 小时过期或进程重启，token 就没了。
- 从来没调过 `/item/remove`。

除了删除，别处根本不用这个 token。但它一旦丢了，对应 Item 就永远删不掉，每个月照常扣费。

整件事围着这一条约束转：==删除离不开 token，token 就得比每一次失败的删除活得更久。==

## 候选方案

审计给了两条路：

- **A.** 在 `plaidComplete` 里验完马上调 `plaidRemove`，只留状态。
- **B.** 在 prune 和关机时逐个删 Item。

PR #76（`audit2-accounts`，claude2）选了 A 并加上有上限的重试。后面几轮评审反复改写了「有上限的重试」的具体做法。

## 评审轮次

| 轮次 | 评审者 | 发现的缺陷 | 改动 |
| --- | --- | --- | --- |
| 审计 2 | 3 个 opus 审计员 | token 只在内存；从没调 `/item/remove`；Item 永远计费 | 验证后立刻删 |
| PR #76 评审 | Codex | 验证后立刻删，一旦失败就丢 token；Item 照样永远计费 | token 留服务端并重试 |
| PR #76 复审 | opus | 永久性 4xx 会无限重试；用户断开连接永远返 502 | 服务级孤儿队列，最多 3 次；遇永久性错误放弃并记 `PLAID_REMOVE_ABANDONED`；断开不再等 Plaid |
| 发布 | — | 孤儿队列放内存，重启就丢（窗口约 3 分钟） | 未做 |

每版修法堵了上一个漏洞，又开了下一个：

1. **立刻删除**解决了「从不删」，但把 token 寿命压成只有一次调用那么长，单次调用失败就跟以前一样永久泄漏。
2. **留 token 重试**堵了泄漏，可它把所有失败一视同仁，碰上永远不会成功的永久性 4xx 会无限重下去；用户点断开又在等它，结果每次都返 502。
3. **有上限的孤儿队列**收住了无限重试。现在 token 活多久看队列，队列活多久看进程。

PR #76 前后过了两轮 opus 评审、两轮 Codex 评审和两轮修改。

## 决定

孤儿队列的规则：

- 删除失败后把 token 留在服务端；
- 最多重试到总共 3 次；
- 遇到永久性 4xx 直接放弃，并记 `PLAID_REMOVE_ABANDONED`；
- 跑在服务层，用户断开连接不用等 Plaid 就能返回。

![验证后，Plaid 移除成功就丢弃令牌，短暂失败则留在内存队列重试，服务重启会丢失队列。](../../Diagrams/2026-10-24-plaid-item-removal-retry-after-verification.removal-states.svg)

这版发布接受了内存队列。重试窗口内一旦重启，队列里的 token 会丢，对应 Item 继续计费；源材料估的窗口约 3 分钟。

## 验证

| 检查 | 结果 |
| --- | --- |
| `go vet ./...` | 无问题 |
| 在 #76 最终 head（`a8f509d`）跑 `go test -race ./...` | 10 个包通过 |
| 发布 | PR #78（`integration/audit-2` → main），合并 `8051511`；issue #73 已关 |

## 范围之外（YAGNI）

- 持久化孤儿队列。源材料把内存队列记在「未做」里，附上了上面约 3 分钟的重启窗口。

## 经验与小技巧

- 调可能失败的清理前，先把清理要用的东西存住。删除靠 token，token 寿命就得长过失败的删除，不然一次失败就会永久泄漏资源。这跟 [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]] 是一条原则，只是落在了服务端句柄上。
- 重试得有两道闸：区分临时错误和永久错误，再限最大次数。缺第一道，永久性 4xx 会死循环。
- 面向用户的操作别卡在第三方清理上。孤儿队列把清理移出断开链路前，用户断开一直报 502。
- 把每轮修复当新设计来审，这次每轮都从上一版修法里审出了新缺陷。
- 内存队列的持久度跟着进程走，上线时像这次一样把敞口时间写明。

## 相关笔记

- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/PR|PR]]
