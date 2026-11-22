---
type: case-design
date: 2026-11-04
tags: [design, frontend, backend, idempotency, recovery, frontend-state, workflow, openapi]
status: wip
publish: true
---
# 结构方案助手的提交恢复与放弃

结构方案助手面板提交每张确认卡片，要走六步链。每拿到服务端 id 都先存下来再发下一步。顺序这么定了，==本地手里的 id 就给服务端可能持有的对象划了上限==。

由这个上限推出三个决定：

1. 第一条请求发出前先冻结提交快照。
2. 「放弃恢复」（abandon）先查服务端有没有 execution，再决定放弃什么。
3. 结构类 execution 不该占每任务的执行槽。

前两条随 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ [[zh/Glossary/PR|PR]] ▒▒▒▒ 上线，▒▒▒▒▒▒▒▒ 于 2026-11-04 合入，合并提交 `▒▒▒▒▒▒▒▒▒▒▒▒`。第三条另开 PR，写这篇时还在做。

用到的技巧：[[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]。

## 背景与约束

改动分布：

- Issue ▒▒▒▒（▒▒▒▒▒▒▒▒ 开），PR ▒▒▒▒，分支 `feat/structure-partial-replace`
- 四个提交：`▒▒▒▒▒▒▒▒▒▒▒▒`、`▒▒▒▒▒▒▒▒▒▒▒▒`、`▒▒▒▒▒▒▒▒▒▒▒▒`、`▒▒▒▒▒▒▒▒▒▒▒▒`
- 代码：
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts`
  - `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py`

面板向 ▒▒▒▒▒▒▒▒ 要 N 张编辑卡片。▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 补了推荐值、跨批次去重和当前批次部分替换。

确认卡片走 tool-work 链：create → prepare → executions → recover → authorize → submit。create 建 **Work**（`POST /works` 对应的服务端对象），prepare 建 **execution**（初始状态为 `prepared` 的服务端记录），authorize 和 submit 都要带 `executionId`，返回 `runId`。

每步靠存在 `sessionStorage`（浏览器按标签页隔离的存储）里的身份字段串联：`createId`、`submitId`、`actionId`、`workId`、`revision`、`executionId`、`runId`。客户端生成的 key 起 [[zh/Glossary/Idempotency key|idempotency key]]（幂等键）作用：请求带着它，重试时服务端返回原对象，不新建。

### 本地 id 与服务端

除了客户端生成的 `createId`，这条链在两个时刻写入服务端 id：

| 时刻 | 已持久化 | 本地 id 允许的服务端状态 |
| --- | --- | --- |
| create 之前 | `createId`、快照、`attempted` | 最多一个草稿 Work |
| create 返回后、prepare 之前 | `workId` | 最多一个 `prepared` execution |
| prepare 返回后、authorize/submit 之前 | `executionId` | 什么都可能有；按 `executionId` 恢复 |

后面所有设计都靠这两条规则撑着：

- 本地没有 `workId`，服务端最多有一个草稿 Work，没有 execution。
- 有 `workId`、没有 `executionId`，服务端最多有一个 `prepared` execution。

这个 `prepared` execution 永远不会跑，因为 authorize 和 submit 都要 `executionId`，它也不占任务槽。`task_execution_occupancy` 统计占任务的 execution，只计 `submitting`、`recovery_needed` 和 `bound` 三种状态；状态过滤在 `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py`，原会话读到的版本里是第 169 行。

## 候选方案

### prepare 响应丢失

- **方案 A：只在本地把卡片标成已放弃。** `▒▒▒▒▒▒▒▒▒▒▒▒` 第一版就是这么干的：恢复失败且本地没存 `executionId`，直接标放弃。
- **方案 B：先查服务端。** 读 Work 下的 execution，还有活着的就接回，确认没有再放弃。

方案 A 评审没过，▒▒▒▒▒▒▒▒ 追了三个问题：

- prepare 响应丢了，「已放弃·未运行」凭什么站得住？服务端可能已经建了 execution，只是客户端没收到回包。
- 后面怎么对账？
- 第二次生成时，怎么防止同一个请求建两次？

### 每任务执行槽

- **方案 A：保留执行槽。** 网页打开可写任务时，`PUT /agent-conversation` 建 `AgentCheckpoint`，此后 `task_execution_occupancy` / `require_execution_slot` 只许每个任务有一个未完成 execution。
- **方案 B：结构类 execution 和 run 不计入占用。**

11/03 跑的是方案 A。批量确认三张卡片，服务端只接了第一张，第二张收到：

```
409 TASK_EXECUTION_BUSY "当前聊天仍有执行或待答问题，暂不能提交新执行或修改输入。"
```

![第一张卡片占用唯一未完成执行槽位，第二张收到 TASK_EXECUTION_BUSY，批次暂停并等待手动恢复。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.execution-slot.svg)

批量提交就此暂停（「批量提交暂停」，卡片 2 显示「提交中·待恢复」）。后面每张都得等上一个 run 结束、用户手动恢复才能交。三个 run 最后全交付了（装配复检通过），服务端正好三个助手 Work 外加基础 Work。

没丢也没重，只是退化成串行。这种串行在 ▒▒▒▒ 之前就存在，是 ▒▒▒▒（批量确认）带进来的，和两件事直接打架：▒▒▒▒ 的结构十路并发，以及面板上写的「后台最多同时运行10个」。

## 决定

### 提交快照

第一次 create 之前，把卡片标题、草稿连同 `attempted` 冻结进身份。`remember()` 必须成功，不然什么都不发。

用户后面再改卡片，也不会顶着旧草稿的身份去提交。

### 放弃恢复

选方案 B，提交 `▒▒▒▒▒▒▒▒▒▒▒▒`（「放弃恢复先核对服务端执行，有则接回原执行」）：

![放弃恢复前先检查 Work 的执行，有可恢复执行就接回，避免把卡片标成未运行。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.abandon-decision.svg)

- `abandonPromptSuggestion` 先查 Work 下的 execution。
- 只要存在非终态 execution（终态指 `stale` 或 `rejected`），客户端就接回（re-bind，挂回本地身份）。结果返回 `"rebound"`，面板显示「已接回，请恢复提交」，卡片仍可恢复；下次提交不再 create，也不再 prepare。
- 只有服务端确认没有这类 execution，卡片才标成已放弃（「已放弃 · 未运行」）。
- 本地没 `workId`，一个请求都不发。
- **放弃只在页面侧记账。** 服务端记录不动；卡片保留 `createId`，下次生成做一对一合并时复用这个身份，不会建出第二个 Work。

接受的代价：run 已经跑完的 `bound` execution 也会接回，显示「已受理」。这个标签准确，也不会误标「未运行」，换来的是规则简单、本地状态和服务端绝不打架。

随提交补的四条测试：

- 接回的卡片只提交一次，不再 prepare 也不再 create；
- 没有 execution → 已放弃；
- 没有 `workId` → 不发请求；
- 面板显示接回状态。

abandon → re-bind 只有单元测试覆盖，没跑浏览器 e2e。

### 每任务执行槽

负责人 2026-11-04 定了方案 B：结构类 execution 和 run 不计入占用。

- 分支：`fix/structure-execution-occupancy`
- 提交标题：`fix(workflow): 结构执行不再占用任务槽，批量确认按设计并行`
- 状态：写这篇时还在做，未合并。

## 模块划分

| 文件 | 本文记录的内容 |
| --- | --- |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx` | 结构方案助手面板；测试在 `StructurePromptAssistant.test.tsx` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts` | 测试在 `promptSuggestions.test.ts` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts` | 网页端 tool-work API |
| `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py` | `task_execution_occupancy` 及状态过滤 |

身份字段放 `sessionStorage`，一卡一份；服务端存 Work、execution 和 run。

## 数据流

![面板先持久化刚返回的标识，再发送依赖该标识的下一条请求。](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.submit-chain.svg)

每条蓝色箭头都是一次 `sessionStorage` 写入，且落在依赖它的请求之前。create 或 submit 丢回包后，恢复照样用同一组 id（见「验证」）。

### Lease 冲突

[[zh/Glossary/Lease|Lease]]（租约）是请求对任务的短暂占用。遇 Lease 冲突（`409 TASK_ACTIVITY_CONFLICT`）拿同一身份重试最多三次，因为另一张卡片后台的 `/executions/{id}/recover` 轮询可能短暂占着任务 lease。

11/03 的 e2e 撞上了这情况：卡片 2 的 `POST /works` 碰上卡片 1 的后台 recover；整轮里后台 `POST /executions/{id}/recover` 共三次撞上 `TASK_ACTIVITY_CONFLICT`。

重试次数抄自会话摘要，没回最终代码里核对。

## 弯路

### OpenAPI enum 顺序

PR 首轮 [[zh/Glossary/CI-CD|CI]] 挂在 `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`，同一运行里单独的 `Contract drift` job 却过了。smoke job 有自己的契约步骤，重生成契约后做 diff：

```
apps/▒▒▒▒▒▒▒▒▒▒▒▒/.venv/bin/python scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
node_modules/.bin/vp fmt agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
git diff --exit-code -- agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
```

唯一漂移的 hunk 跟这个功能毫无关系：

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

原因：==`schemas/structure_prediction.py` 里 `StructurePredictionReportItem.source` 写的是 `Literal["real", "mock"]`，其他模型都是 `Literal["mock", "real"]`。== dump 会合并同名 `Source` enum schema，合并后的顺序在 Mac 和 CI 上不一样。

重生成契约的 subagent 看到这行翻转，以为已提交 YAML 过期了，以「改回去 CI 会挂」为由留下了翻转。

- ▒▒▒▒ 修法：恢复 main 原顺序。
- 后续 PR（分支 `fix/structure-source-enum-order`）：把 Literal 统一成 `["mock", "real"]`。

教训见 [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]。

## 验证

- 本地栈跑了三轮并行 [[zh/Glossary/Playwright|Playwright]] [[zh/Glossary/e2e|E2E]]：uvicorn 加 SQLite、`vp dev`、▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 的 venv，以及 ▒▒▒▒ 的 Qwen 隧道。
- 先生成 20 张卡片，再输「这20个里，需要10个改变极耳和焊印长度的，替换掉10个平移方案」：总数保持 20，留下的 10 张跟第一轮逐字节一致。
- create 和 submit 丢回包后，恢复沿用同一组 id；服务端每张卡正好一个 Work、一个 execution。
- 单元测试：`promptSuggestions.test.ts` + `StructurePromptAssistant.test.tsx` 27/27，typecheck 通过。
- 后端：`▒▒▒▒▒▒▒▒▒▒▒▒` 补完空 `allowed_values` 拒绝用例后，pytest 30 passed。
- `▒▒▒▒▒▒▒▒▒▒▒▒` 的 CI：九项 success，一项 skipped（Ubuntu Agent compile pilot）。

## 不做（YAGNI）

- 服务端不记放弃，放弃只记在页面侧，服务端记录不动。
- run 已结束的 `bound` execution 接回后不另加标签，显示「已受理」（即上面接受的代价）。
- abandon → re-bind 不写浏览器 e2e，只留单测。
- 占用豁免放 `fix/structure-execution-occupancy` 单独提 PR，不进 ▒▒▒▒。
- `Literal` 对齐放 `fix/structure-source-enum-order` 单独提 PR。

## 教训与技巧

- 每个服务端 id 都要在发出依赖它的下一步前存好。本地 id 就给服务端能持有的对象划了上限，恢复和放弃都能算出服务端上可能存在什么。见 [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]。
- 放弃前先问服务端，还活着的就接回。规则只有一条，本地状态也不会跟服务端脱节。
- 重生成契约时无关 enum 翻顺序，说明生成结果不确定，不是文件过期。见 [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]。

## 相关

- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]
- [[zh/Agents/regenerated-contract-nondeterministic-enum-order|regenerated-contract-nondeterministic-enum-order]]
- [[zh/Cases/Design/2026-10-15-structure-run-parallelism-capacity|2026-10-15-structure-run-parallelism-capacity]]
- [[zh/Glossary/Idempotency key|Idempotency key]] · [[zh/Glossary/Lease|Lease]]
- [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/e2e|E2E]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/CI-CD|CI-CD]]
