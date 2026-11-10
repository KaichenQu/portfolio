---
type: case-design
date: 2026-11-04
tags: [design, frontend, backend, idempotency, recovery, frontend-state, workflow, openapi]
status: wip
publish: true
---
# Structure assistant submit recovery and abandon

The 结构方案助手 panel submits each confirmed card through a six-step chain. It persists every server id before it sends the next step. Because of that order, ==the ids held locally put an upper bound on what the server can hold==.

Three decisions follow from that bound:

1. The submission snapshot is frozen before the first request.
2. "放弃恢复" (abandon) checks the server for an execution before it gives anything up.
3. Structure executions should not hold the per-task execution slot.

The first two shipped in ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ [[PR]] ▒▒▒▒, which ▒▒▒▒▒▒▒▒ merged on 2026-11-04 as `▒▒▒▒▒▒▒▒▒▒▒▒`. The third is a separate PR. It was still in progress when this note was written.

Technique: [[persist-id-before-next-step]].

## Background and constraints

Where the work lives:

- Issue ▒▒▒▒ (opened by ▒▒▒▒▒▒▒▒), PR ▒▒▒▒, branch `feat/structure-partial-replace`.
- Four commits: `▒▒▒▒▒▒▒▒▒▒▒▒`, `▒▒▒▒▒▒▒▒▒▒▒▒`, `▒▒▒▒▒▒▒▒▒▒▒▒`, `▒▒▒▒▒▒▒▒▒▒▒▒`.
- Code:
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts`
  - `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts`
  - `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py`

The panel asks ▒▒▒▒▒▒▒▒ for N edit cards. ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ adds recommended values, dedup across generations, and partial replacement of the current batch.

Confirming a card runs the tool-work chain: create → prepare → executions → recover → authorize → submit. Create makes a **Work** (the server object behind `POST /works`). Prepare makes an **execution** (a server record that starts in status `prepared`). Authorize and submit need the `executionId` and return a `runId`.

Each step is keyed by an identity persisted in `sessionStorage` (browser storage scoped to the tab): `createId`, `submitId`, `actionId`, `workId`, `revision`, `executionId`, `runId`. The client-generated keys act as [[Idempotency key]]s: a key the client sends with a request so that a retry with the same key resolves to the same server object instead of a new one.

### Local ids and the server

Besides the client-generated `createId`, the chain writes server ids at two points:

| Moment | Persisted | Server state the local ids allow |
| --- | --- | --- |
| before create | `createId`, snapshot, `attempted` | at most a draft Work |
| create returns, before prepare | `workId` | at most a `prepared` execution |
| prepare returns, before authorize/submit | `executionId` | anything; recover by `executionId` |

Everything after this relies on two rules:

- No local `workId` means the server holds at most a draft Work and no execution.
- A `workId` without an `executionId` means the server holds at most a `prepared` execution.

That `prepared` execution never runs, because authorize and submit both need the `executionId`. It also does not occupy the task. `task_execution_occupancy` counts the executions that occupy the task, and it only counts `submitting`, `recovery_needed` and `bound`. The status filter is in `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py`, line 169 on the version read in the original session.

## Candidate options

### Abandon after a lost prepare response

- **Option A, mark the card abandoned locally.** The first version of `▒▒▒▒▒▒▒▒▒▒▒▒` did this when recovery had failed and no `executionId` was stored.
- **Option B, check the server first.** Read the Work's executions, re-bind one if it is still alive, and abandon only when there is none.

Option A broke down in review. ▒▒▒▒▒▒▒▒ asked three questions:

- What does 「已放弃·未运行」 rest on when the prepare response is lost? The server may already hold an execution the client never saw.
- How does later reconciliation stay possible?
- How does a second generation avoid creating the same request twice?

### Per-task execution slot

- **Option A, keep the slot.** When the web opens a writable task, `PUT /agent-conversation` creates an `AgentCheckpoint`. From then on, `task_execution_occupancy` / `require_execution_slot` allow only one unfinished execution per task.
- **Option B, exempt structure executions and runs from occupancy.**

Option A is what ran on 11/03. Batch-confirming three cards accepted only the first. The second got:

```
409 TASK_EXECUTION_BUSY "当前聊天仍有执行或待答问题，暂不能提交新执行或修改输入。"
```

![Execution slot](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.execution-slot.svg)

The batch paused (「批量提交暂停」, card 2 「提交中·待恢复」). Each later card went through only after the previous run finished and the user recovered it by hand. All three runs were delivered (装配复检通过). The server held exactly three assistant Works plus the base Work.

Nothing was lost or duplicated; the runs were only serialized. The serialization predates ▒▒▒▒. It dates from ▒▒▒▒ (batch confirm), and it contradicts two things: the ten-way structure concurrency of ▒▒▒▒, and the panel's own 「后台最多同时运行10个」.

## Decision

### Submission snapshot

Before the first create, the card's title and draft are frozen into the identity, together with `attempted`. `remember()` must succeed, otherwise nothing is sent.

A card the user edits later can therefore never be submitted under an identity that described a different draft.

### Abandon (放弃恢复)

Option B, in `▒▒▒▒▒▒▒▒▒▒▒▒` (「放弃恢复先核对服务端执行，有则接回原执行」).

![Abandon decision](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.abandon-decision.svg)

- `abandonPromptSuggestion` reads the Work's executions first.
- If any non-terminal execution exists (terminal means `stale` or `rejected`), the client re-binds it, that is, attaches it to the local identity. The result is `"rebound"`, the panel shows 「已接回，请恢复提交」, and the card stays recoverable. The next submit neither creates nor prepares again.
- Only when the server reports no such execution does the card become abandoned (「已放弃 · 未运行」).
- With no `workId`, no request is sent at all.
- **Abandonment is page-side bookkeeping only.** The server records stay as they are. The card keeps its `createId`, so the one-to-one merge on the next generation reuses that identity instead of creating a second Work.

Trade-off accepted: a `bound` execution whose run has already finished is also re-bound, and then shows 已受理. That label is accurate, and the card is never labelled 未运行. In exchange the rule stays simple, and no local state can contradict the server's.

Tests added with the commit:

- a re-bound card submits once, without prepare or create;
- no execution → abandoned;
- no `workId` → no request;
- the panel shows the re-bound state.

The abandon → re-bind path was covered by unit tests only, not by a browser e2e.

### Per-task execution slot

Owner decision 2026-11-04: option B. Structure executions and runs are exempt from occupancy.

- Branch: `fix/structure-execution-occupancy`
- Commit subject: `fix(workflow): 结构执行不再占用任务槽，批量确认按设计并行`
- State: in progress, not merged, when this note was written.

## Module breakdown

| File | Recorded here |
| --- | --- |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/StructurePromptAssistant.tsx` | the 结构方案助手 panel; tested by `StructurePromptAssistant.test.tsx` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/structure/promptSuggestions.ts` | tested by `promptSuggestions.test.ts` |
| `apps/web/src/▒▒▒▒▒▒▒▒▒▒▒▒/fullstack/toolWorkApi.ts` | the tool-work API on the web side |
| `apps/▒▒▒▒▒▒▒▒▒▒▒▒/src/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒/workflow/storage.py` | `task_execution_occupancy` and its status filter |

The identity fields live in `sessionStorage`, one identity per card. The server side keeps Works, executions and runs.

## Data flow

![Submit chain](../../Diagrams/2026-11-04-structure-assistant-submit-recovery-and-abandon.submit-chain.svg)

Every blue arrow is a write to `sessionStorage`, and each one happens before the request that depends on it. A lost create or submit response therefore recovers with the same ids (see Verification).

### Lease conflicts

A [[Lease]] is a short hold one request takes on the task. Lease conflicts (`409 TASK_ACTIVITY_CONFLICT`) are retried up to three times with the same identity, because a background `/executions/{id}/recover` poll on another card can hold the task lease for a moment.

The e2e round on 11/03 hit this case: card 2's `POST /works` collided with a background recover on card 1. Background `POST /executions/{id}/recover` hit `TASK_ACTIVITY_CONFLICT` three times in that round.

The retry count comes from the session summary and was not re-read from the final code.

## Wrong turns

### OpenAPI enum order

The PR's first [[CI-CD|CI]] run failed in `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`. The standalone `Contract drift` job passed in the same run. The smoke job has its own contract step, which regenerates and diffs the contract:

```
apps/▒▒▒▒▒▒▒▒▒▒▒▒/.venv/bin/python scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
node_modules/.bin/vp fmt agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
git diff --exit-code -- agent_docs/2026-08-12-fullstack-chat/api-contract.yaml
```

The only drifting hunk was unrelated to the feature:

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

Cause: ==`StructurePredictionReportItem.source` in `schemas/structure_prediction.py` is `Literal["real", "mock"]`, while every other model uses `Literal["mock", "real"]`.== The dump merges same-named `Source` enum schemas, and the merged order differs between the Mac and CI.

The subagent that regenerated the contract had noticed the flipped line. It concluded that the committed YAML was stale and kept the flip, reasoning "reverting would fail CI".

- Fix in ▒▒▒▒: restore main's order.
- Follow-up PR on `fix/structure-source-enum-order`: align the Literal to `["mock", "real"]`.

Lesson: [[regenerated-contract-nondeterministic-enum-order]].

## Verification

- Three parallel [[Playwright]] [[e2e|E2E]] rounds on a local stack: uvicorn with SQLite, `vp dev`, the ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ venv, and the ▒▒▒▒ Qwen tunnel.
- 20 cards, then 「这20个里，需要10个改变极耳和焊印长度的，替换掉10个平移方案」: the count stays 20, and the 10 retained cards are byte-identical to round 1.
- Lost create and submit responses recover with the same ids. The server shows exactly one Work and one execution per card.
- Unit tests: `promptSuggestions.test.ts` + `StructurePromptAssistant.test.tsx` 27/27; typecheck passes.
- Backend: pytest 30 passed after `▒▒▒▒▒▒▒▒▒▒▒▒` added the empty `allowed_values` rejection case.
- CI on `▒▒▒▒▒▒▒▒▒▒▒▒`: nine checks success, one skipped (Ubuntu Agent compile pilot).

## Out of scope (YAGNI)

- No server-side record of abandonment. It is page-side bookkeeping, and the server records stay as they are.
- No separate label for a re-bound `bound` execution whose run already finished; it shows 已受理 (the trade-off above).
- No browser e2e for abandon → re-bind; unit tests only.
- The occupancy exemption ships in its own PR on `fix/structure-execution-occupancy`, not in ▒▒▒▒.
- The `Literal` alignment ships in its own PR on `fix/structure-source-enum-order`.

## Lessons and small tricks

- Persist each server id before sending the step that needs it. The local ids then bound what the server can hold, so recovery and abandon know which server objects can exist. See [[persist-id-before-next-step]].
- Abandon should ask the server before giving up. Re-binding whatever is still alive keeps one rule, and no local state can contradict the server's.
- A regenerated contract that flips an unrelated enum is a nondeterminism signal, not a stale file. See [[regenerated-contract-nondeterministic-enum-order]].

## Related

- [[persist-id-before-next-step]]
- [[regenerated-contract-nondeterministic-enum-order]]
- [[2026-10-15-structure-run-parallelism-capacity]]
- [[Idempotency key]] · [[Lease]]
- [[Playwright]] · [[e2e|E2E]] · [[PR]] · [[CI-CD]]
