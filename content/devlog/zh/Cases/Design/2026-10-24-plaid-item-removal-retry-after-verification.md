---
type: case-design
date: 2026-10-24
tags: [design, backend, go, retry, third-party-api]
status: solved
---
# Plaid Item 删除与验证后重试

KairoTrade 用 Plaid 连接验证用户的账户，验证完就不再需要这个连接，应该把它删掉。到 10/24 为止从来没删过，所以每个验证过的连接都在持续计费。

最终设计把 access token 留在服务端，直到删除成功。删除失败的进入孤儿队列（orphan queue），总共最多试 3 次，遇到永久性 4xx 立刻放弃。==三轮评审，每一轮都在上一轮的修复里找到了缺陷==，最后发现的那个还没解决：队列存在内存里。

下文用到的术语：

- **Plaid** 负责把应用和用户的银行或券商账户连起来。
- **Item** 是 Plaid 对单个连接的记录。只要它存在，就按月计费。
- **access token** 是应用为某个 Item 持有的凭据。拿它调用 `/item/remove` 就能删除这个 Item。

## 背景与约束

第二次全仓库审计（main `2d4a7b3` ）把它列为 should 级第 7 项：

```
internal/accounts/connection_security.go:155-159
internal/accounts/aggregators.go:88-99
```

- Plaid access token 只存在内存里。
- 条目 24 小时后过期或者进程重启，token 就丢了。
- 从来没有调用过 `/item/remove` 。

除了删除，没有别的地方读这个 token。所以别处都不需要它，但它一丢，这个 Item 就再也删不掉，每个月接着计费。

整个案例都围绕这条约束：==删除需要 token，所以 token 必须比每一次失败的删除活得更久。==

## 候选方案

审计给了两种修法：

- **A.** 在 `plaidComplete` 里，验证完马上调用 `plaidRemove` ，只保留状态。
- **B.** 在 prune 和关机时逐个删除 Item。

PR #76（`audit2-accounts` ，claude2）选了 A，并加上有上限的重试。之后的几轮评审改变了“有上限的重试”具体指什么。

## 评审轮次

| 轮次 | 评审者 | 发现的缺陷 | 改动 |
| --- | --- | --- | --- |
| 审计 2 | 3 个 opus 审计员 | token 只在内存里；从没调用 `/item/remove` ；Item 永远计费 | 验证后立即删除 |
| PR #76 评审 | Codex | 验证后立即删除，一旦失败就丢掉 token；Item 永远计费 | token 留在服务端并重试 |
| PR #76 复审 | opus | 永久性 4xx 会一直重试下去；用户断开连接永远返回 502 | 服务级孤儿队列，最多 3 次；遇到永久性错误直接放弃并记录 `PLAID_REMOVE_ABANDONED` ；断开连接不再等 Plaid |
| 发布 | — | 孤儿队列在内存里，重启就丢（窗口约 3 分钟） | 未做 |

每次修复都堵上了前一个缺陷，又打开了下一个：

1. **立即删除** 修好了“从来不删”。但它把 token 的寿命缩短到只有一次调用那么长，一次调用失败，Item 就和以前一样泄漏了。
2. **保留 token 并重试** 修好了泄漏。但它对所有失败都同样重试，包括永久性 4xx，也就是永远不会成功的错误。重试永不结束，而用户的断开操作要等它，于是每次都以 502 失败。
3. **有上限的孤儿队列** 修好了无限重试。现在 token 的寿命等于队列的寿命，队列的寿命等于进程的寿命。

PR #76 经过了 opus 两轮评审、Codex 两轮评审，以及两轮修复。

## 决定

孤儿队列的行为：

- 删除失败后把 token 留在服务端；
- 重试删除，总共 3 次；
- 遇到永久性 4xx 就放弃，并记录 `PLAID_REMOVE_ABANDONED` ；
- 在服务层运行，所以用户断开连接时不用等 Plaid 就能返回。

![验证后，Plaid 移除成功就丢弃令牌，短暂失败则留在内存队列重试，服务重启会丢失队列。](../../Diagrams/2026-10-24-plaid-item-removal-retry-after-verification.removal-states.svg)

这次发布接受了队列放在内存里。重试窗口内一旦重启，队列里的 token 就丢了，对应的 Item 会继续计费。源材料给的窗口约 3 分钟。

## 验证

| 检查 | 结果 |
| --- | --- |
| `go vet ./...` | 无问题 |
| 在 #76 最终 head（`a8f509d` ）上跑 `go test -race ./...` | 10 个包通过 |
| 发布 | PR #78（`integration/audit-2` → main），合并 `8051511` ；issue #73 已关闭 |

## 范围之外（YAGNI）

- 持久化的孤儿队列。源材料把内存队列列在“未做”里，并附上了上面说的重启窗口。

## 经验与小技巧

- 调用可能失败的清理操作之前，先把清理需要的东西存好。删除需要 token，token 就必须比失败的删除活得久，否则一次失败就会让资源永久泄漏。这和 [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]] 是同一条规则，只是用在了服务端句柄上。
- 重试需要两道限制：区分临时错误和永久错误，再加最大次数。少了第一道，永久性 4xx 会一直循环下去。
- 面向用户的操作不该等第三方清理。在队列把清理移出断开流程之前，断开连接一直返回 502。
- 把每次修复当成新设计来评审。这次每一轮都发现了上一轮修复带进来的缺陷。
- 内存队列能保存多久，取决于进程活多久。像这次发布一样，把它留下的窗口写清楚。

## 相关笔记

- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Glossary/PR|PR]]
