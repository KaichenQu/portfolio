---
type: case-design
date: 2026-11-04
tags: [design, frontend, backend, idempotency, recovery, frontend-state, workflow, openapi]
status: wip
publish: true
---
# 结构方案助手的提交恢复与放弃

结构方案助手面板提交每张确认过的卡片，要走六步链。每拿到服务端 id，先存下来，再发下一步。顺序这样定了，==本地手里的 id 就给服务端可能持有的东西划了上限==。

从这个上限推出三个决定：

1. 第一个请求发出之前，先冻结提交快照。
2. 「放弃恢复」（abandon）先去服务端查有没有 execution，查完再决定放弃什么。
3. 结构类 execution 不该占用每个任务的执行槽。

前两条在 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ [[zh/Glossary/PR|PR]] ▒▒▒▒ 上线，▒▒▒▒▒▒▒▒ 在 2026-11-04 合并，合并提交是 `▒▒▒▒▒▒▒▒▒▒▒▒` 。第三条单独开 PR，写这篇笔记时还在做。

用到的技巧：[[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]。

## 背景与约束

工作分布：

- Issue ▒▒▒▒（▒▒▒▒▒▒▒▒ 开的），PR ▒▒▒▒，分支 `feat/structure-partial-replace`
- 四个提交：`▒▒▒▒▒▒▒▒▒▒▒▒` 、`▒▒▒▒▒▒▒▒▒▒▒▒` 、`▒▒▒▒▒▒▒▒▒▒▒▒` 、`▒▒▒▒▒▒▒▒▒▒▒▒`
- 代码：
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts`
  - `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py`

面板向 ▒▒▒▒▒▒▒▒ 要 N 张编辑卡片。▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 加了推荐值、跨批次去重，以及对当前批次的部分替换。

确认卡片会跑 tool-work 链：create → prepare → executions → recover → authorize → submit。create 生成 **Work**（`POST /works` 背后的服务端对象）。prepare 生成 **execution**（服务端记录，初始状态是 `prepared` ）。authorize 和 submit 都要带 `executionId` ，返回 `runId` 。

每一步都靠存在 `sessionStorage` （浏览器里按标签页隔离的存储）里的身份字段定位：`createId` 、`submitId` 、`actionId` 、`workId` 、`revision` 、`executionId` 、`runId` 。其中客户端生成的 key 起 [[zh/Glossary/Idempotency key|idempotency key]]（幂等键）的作用：客户端随请求带上这个 key，用同一个 key 重试时，服务端返回原来那个对象，不会新建。

### 本地 id 与服务端

除了客户端生成的 `createId` ，这条链还在两个时刻写入服务端 id：

| 时刻 | 已持久化 | 本地 id 允许的服务端状态 |
| --- | --- | --- |
| create 之前 | `createId` 、快照、`attempted` | 最多一个草稿 Work |
| create 返回后、prepare 之前 | `workId` | 最多一个 `prepared` execution |
| prepare 返回后、authorize/submit 之前 | `executionId` | 什么都可能有；按 `executionId` 恢复 |

后面的内容全都依赖两条规则：

- 本地没有 `workId` ，服务端最多有一个草稿 Work，没有 execution。
- 有 `workId` 、没有 `executionId` ，服务端最多有一个 `prepared` execution。

这个 `prepared` execution 永远不会运行，因为 authorize 和 submit 都需要 `executionId` 。它也不占用任务。`task_execution_occupancy` 统计占用任务的 execution，只算 `submitting` 、`recovery_needed` 和 `bound` 三种状态。状态过滤写在 `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py` ，原会话读到的版本里是第 169 行。

## 候选方案

### prepare 响应丢失

- **方案 A：只在本地把卡片标成已放弃。** `▒▒▒▒▒▒▒▒▒▒▒▒` 的第一版就是这样做的：恢复失败、本地又没存 `executionId` ，就直接标记。
- **方案 B：先查服务端。** 读出 Work 下的 execution，还活着的就接回，一个都没有才放弃。

方案 A 在评审时站不住。▒▒▒▒▒▒▒▒ 问了三个问题：

- prepare 响应丢了，「已放弃·未运行」凭什么成立？服务端可能已经有 execution，只是客户端没见过。
- 之后怎么还能对账？
- 第二次生成时，怎么避免同一个请求创建两次？

### 每任务执行槽

- **方案 A：保留执行槽。** 网页打开可写任务时，`PUT /agent-conversation` 会创建 `AgentCheckpoint` 。从那以后，`task_execution_occupancy` / `require_execution_slot` 只允许每个任务有一个未完成的 execution。
- **方案 B：结构类 execution 和 run 不计入占用。**

11/03 实际跑的是方案 A。批量确认三张卡片，服务端只接受了第一张。第二张收到：

```
409 TASK_EXECUTION_BUSY "当前聊天仍有执行或待答问题，暂不能提交新执行或修改输入。"
```

![第一张卡片占用唯一未完成执行槽位，第二张收到 TASK_EXECUTION_BUSY，批次暂停并等待手动恢复。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.execution-slot.svg)

批量提交停了下来（「批量提交暂停」，卡片 2 显示「提交中·待恢复」）。后面每张卡片都要等上一个 run 结束、用户手动恢复之后才能提交。三个 run 最后都交付了（装配复检通过）。服务端正好有三个助手 Work，外加基础 Work。

没有丢，也没有重复，只是变成了串行。这种串行在 ▒▒▒▒ 之前就有，是 ▒▒▒▒（批量确认）带进来的。它和两件事矛盾：▒▒▒▒ 的结构十路并发，以及面板自己写的「后台最多同时运行10个」。

## 决定

### 提交快照

第一次 create 之前，把卡片的标题和草稿连同 `attempted` 一起冻结进身份。`remember()` 必须成功，否则什么都不发。

所以用户之后再改卡片，也不会拿着旧草稿的身份去提交。

### 放弃恢复

选方案 B，提交是 `▒▒▒▒▒▒▒▒▒▒▒▒` （「放弃恢复先核对服务端执行，有则接回原执行」）。

![放弃恢复前先检查 Work 的执行，有可恢复执行就接回，避免把卡片标成未运行。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.abandon-decision.svg)

- `abandonPromptSuggestion` 先读 Work 下的 execution。
- 只要有非终态 execution（终态指 `stale` 或 `rejected` ），客户端就把它接回（re-bind），也就是挂回本地身份上。结果是 `"rebound"` ，面板显示「已接回，请恢复提交」，卡片仍然可以恢复。下一次提交不会再 create，也不会再 prepare。
- 只有服务端确认没有这样的 execution，卡片才变成已放弃（「已放弃 · 未运行」）。
- 本地没有 `workId` ，就一个请求都不发。
- **放弃只是页面这边记的账。** 服务端记录原样保留。卡片保留 `createId` ，所以下一次生成做一对一合并时会复用这个身份，不会再建第二个 Work。

接受的代价：run 已经跑完的 `bound` execution 同样会接回，然后显示「已受理」。这个标签没错，卡片也不会标成「未运行」。换来的是规则简单，本地状态也不可能和服务端对不上。

随这个提交加的测试：

- 接回的卡片只提交一次，不再 prepare，也不再 create；
- 没有 execution → 已放弃；
- 没有 `workId` → 不发请求；
- 面板显示接回状态。

abandon → re-bind 这条路径只有单元测试覆盖，没有浏览器 e2e。

### 每任务执行槽

负责人 2026-11-04 拍板：方案 B。结构类 execution 和 run 不计入占用。

- 分支：`fix/structure-execution-occupancy`
- 提交标题：`fix(workflow): 结构执行不再占用任务槽，批量确认按设计并行`
- 状态：写这篇笔记时还在做，没有合并。

## 模块划分

| 文件 | 本文记录的内容 |
| --- | --- |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx` | 结构方案助手面板；测试在 `StructurePromptAssistant.test.tsx` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts` | 测试在 `promptSuggestions.test.ts` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts` | 网页端的 tool-work API |
| `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py` | `task_execution_occupancy` 和它的状态过滤 |

身份字段存在 `sessionStorage` 里，每张卡片一份身份。服务端保存 Work、execution 和 run。

## 数据流

![面板先持久化刚返回的标识，再发送依赖该标识的下一条请求。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.submit-chain.svg)

每条蓝色箭头都是一次 `sessionStorage` 写入，而且都发生在依赖它的请求之前。所以 create 或 submit 的响应丢了，恢复时用的还是同一组 id（见「验证」）。

### Lease 冲突

[[zh/Glossary/Lease|Lease]]（租约）指某个请求对任务的短暂占用。Lease 冲突（`409 TASK_ACTIVITY_CONFLICT` ）会用同一个身份重试，最多三次，因为另一张卡片的后台 `/executions/{id}/recover` 轮询可能会短暂占着任务的 lease。

11/03 那一轮 e2e 就碰上了：卡片 2 的 `POST /works` 撞上了卡片 1 的后台 recover。那一轮里，后台 `POST /executions/{id}/recover` 一共三次碰到 `TASK_ACTIVITY_CONFLICT` 。

重试次数取自会话摘要，没有回到最终代码里重新核对。

## 弯路

### OpenAPI enum 顺序

PR 的第一次 [[zh/Glossary/CI-CD|CI]] 挂在 `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 。同一次运行里，单独的 `Contract drift` job 通过了。smoke job 有自己的契约步骤，会重新生成契约再做 diff：

```
apps/▒▒▒▒▒▒▒▒▒▒▒▒/.venv/bin/python scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
node_modules/.bin/vp fmt agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
git diff --exit-code -- agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
```

唯一漂移的 hunk 和这个功能无关：

```
@@ -17896,8 +17896,8 @@ components:
           anyOf:
             - type: string
               enum:
-                - mock
                 - real
+                - mock
             - type: "null"
           title: Source
```

原因：==`schemas/structure_prediction.py` 里 `StructurePredictionReportItem.source` 是 `Literal["real", "mock"]` ，其他模型都是 `Literal["mock", "real"]` 。==dump 会把同名的 `Source` enum schema 合并，合并后的顺序在 Mac 和 CI 上不一样。

重新生成契约的那个 subagent 看到了这行翻转。它认定已提交的 YAML 过期了，理由是「改回去 CI 会挂」，于是留下了翻转。

- ▒▒▒▒ 里的修法：恢复 main 的顺序。
- 后续 PR（分支 `fix/structure-source-enum-order` ）：把 Literal 统一成 `["mock", "real"]` 。

教训：[[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]。

## 验证

- 在本地栈上跑了三轮并行的 [[zh/Glossary/Playwright|Playwright]] [[zh/Glossary/e2e|E2E]]：uvicorn 加 SQLite、`vp dev` 、▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 的 venv，以及 ▒▒▒▒ 的 Qwen 隧道。
- 先生成 20 张卡片，再输入「这20个里，需要10个改变极耳和焊印长度的，替换掉10个平移方案」：总数还是 20，保留下来的 10 张和第一轮逐字节一致。
- create 和 submit 的响应丢了之后，恢复用的是同一组 id。服务端每张卡片正好一个 Work、一个 execution。
- 单元测试：`promptSuggestions.test.ts` + `StructurePromptAssistant.test.tsx` 27/27；typecheck 通过。
- 后端：`▒▒▒▒▒▒▒▒▒▒▒▒` 加上空 `allowed_values` 的拒绝用例后，pytest 30 passed。
- `▒▒▒▒▒▒▒▒▒▒▒▒` 上的 CI：九项检查 success，一项 skipped（Ubuntu Agent compile pilot）。

## 不做（YAGNI）

- 服务端不记录放弃。放弃是页面这边记的账，服务端记录原样保留。
- run 已经结束的 `bound` execution 接回后不另设标签，显示「已受理」（就是上面接受的代价）。
- abandon → re-bind 不做浏览器 e2e，只有单元测试。
- 占用豁免放在 `fix/structure-execution-occupancy` 上单独提 PR，不进 ▒▒▒▒。
- `Literal` 对齐放在 `fix/structure-source-enum-order` 上单独提 PR。

## 教训与技巧

- 每个服务端 id 都要在发出需要它的那一步之前存好。这样本地 id 就给服务端能持有的东西划了上限，恢复和放弃都知道服务端上可能有哪些对象。见 [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]。
- 放弃之前先问服务端。还活着的就接回，这样只有一条规则，本地状态也不可能和服务端对不上。
- 重新生成契约时无关的 enum 翻了顺序，说明生成结果不确定，并不是文件过期。见 [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]。

## 相关

- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]
- [[zh/Cases/Design/2026-10-15-structure-run-parallelism-capacity|2026-10-15-structure-run-parallelism-capacity]]
- [[zh/Glossary/Idempotency key|Idempotency key]] · [[zh/Glossary/Lease|Lease]]
- [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/e2e|E2E]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/CI-CD|CI-CD]]
