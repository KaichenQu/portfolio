---
type: case-design
date: 2026-10-15
tags: [design, backend, concurrency, admission, cli, ops]
status: solved
---
# Structure Run parallelism and pool capacity

Raising the trial site's structure-run concurrency N from 1 to 2 broke every new run. ==The permit pool writes its capacity to the database on first use, so a later change to N in the env file no longer matched the stored row, and every admission raised `EXECUTION_RESOURCE_CONFIG_CHANGED`.==

The decision, in [[PR]] ▒▒▒▒: a `trial_cli set-capacity` command that rewrites the stored capacity and refuses while any permit is still held. The same PR made the queue position count all N slots. Two runs then ran side by side in about 104 s each, against an estimated 195 s run one after the other.

## Background and constraints

A structure **Run** is one CAD edit job on the trial site. Runs pass through **admission**, the check that decides whether a run may start now or must wait.

Admission draws on a **permit pool**: a counting semaphore of capacity N. A run takes a permit (a reservation) to start and gives it back when it ends; with N permits out, the next run queues.

With the trial authorization on, the pool's capacity is written into the table `execution_resource_pools` the first time the pool is used. After that:

- the env file still holds N;
- the row holds the capacity from first use;
- if the two differ, every structure admission raises `EXECUTION_RESOURCE_CONFIG_CHANGED`.

Before ▒▒▒▒ nothing could change that row.

Baseline reproduction:

| Step | Result |
| --- | --- |
| Run once with N=1 | succeeds; capacity 1 stored |
| Set N=2, restart | |
| Submit task A, then task B | both rejected at once with `409` |

## Candidate options

### Option A, change N in the env file and restart

- Approach: what the baseline did.
- Cost: the stored row wins the comparison, so every admission fails until the row changes. There was no way to change it.

### Option B, an explicit command that rewrites the stored capacity

- Approach: `trial_cli set-capacity`, run by an operator on the host.
- Pros: the change is a deliberate step with a printed before and after.
- Cost: one more step in the rollout.

## Decision

Option B, as three commits in ▒▒▒▒:

| Task | Commit | Change |
| --- | --- | --- |
| T1 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `trial_cli set-capacity --kind structure` or `--kind prediction`; refuses with `EXECUTION_RESOURCE_IN_USE` while any reservation is unreleased |
| T2 | `▒▒▒▒▒▒▒▒▒▒▒▒` | queue position counts all N slots |
| T3 | `▒▒▒▒▒▒▒▒▒▒▒▒` | `docs/structure-▒▒▒▒▒▒▒▒▒▒▒▒`, `deploy/trial/README.md` |

▒▒▒▒ merged as `▒▒▒▒▒▒▒▒▒▒▒▒` on 2026-10-15 at 04:42 UTC. pytest went from 135 to 140 passing.

==`set-capacity` changes the capacity only while no permit is held.== A run that holds a permit when the command arrives makes it fail with `EXECUTION_RESOURCE_IN_USE`, and the stored row stays as it was.

### Queue position

The page shows each queued run how many runs are ahead of it. T2 computes it as:

```
runs_ahead = max(0, holding + older - (N - 1))
```

Read from the names, `holding` is the runs that hold a permit now and `older` the queued runs submitted before this one. A run can start once fewer than N permits are taken by the runs before it, so `holding + older - (N - 1)` of them must finish first. The recorded values fit this reading:

| Run | holding | older | N | runs_ahead |
| --- | --- | --- | --- | --- |
| third run, C | 2 | 0 | 2 | 1 |
| fourth run | 2 | 1 | 2 | 2 |

The third run was measured. The fourth run's `runsAhead=2` is covered by a unit test only.

## Data flow

![Runs A, B and C against two permits](../../Diagrams/2026-10-15-structure-run-parallelism-capacity.queue-timeline.svg)

Measured for ▒▒▒▒, with N=2:

| Measurement | Value |
| --- | --- |
| Single run, task A | 98.0 s |
| Single run, task C | 96.4 s |
| Parallel run A | 103.9 s |
| Parallel run B | 104.0 s |
| Gap between A and B submits | 65 ms |
| Serial estimate for A and B | 195 s |
| Third run's position | `runsAhead=1`, page 「排队中 · 前面还有 1 个」 |
| C starts after B ends | 0.35 s |
| C duration | 97.8 s |
| `set-capacity` output | `previousCapacity` 1 → `capacity` 2 |

Run in parallel, A took 5.9 s longer than its single run. A and B together finished in just over half the serial estimate.

The edit [[Lease]] still held while runs were parallel. A lease is a time-limited hold on a task. With A running, a second browser context that claimed A's edit right got `409 TASK_EDIT_OCCUPIED`, and A's page there was read-only (「其他窗口正在编辑，当前可查看与下载。」).

### Rollout on the trial deploy host

| Item | Value |
| --- | --- |
| Run by | the owner, 2026-10-15 04:50Z |
| Output | `previousCapacity` 1 → `capacity` 2 |
| Health | ok |
| N afterwards | 2 |

A later ops record from 10/17, passed on in a task brief and not re-checked there, lists the host's structure concurrency raised from 2 to 4:

```
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒=4
```

with the env file backed up as `api-env.bak-20261017T031414Z`.

## Out of scope (YAGNI)

- **Estimated wait time (T5).** The owner decided not to build it. The page shows the queue position only.
- **A live test of the fourth run's position.** `runsAhead=2` has a unit test and no run on the local stack.
- **Picking N by measurement.** Going from 2 to 3 was left to a week of data: planning latency and `RUNTIME_EXCEEDED` counts. The briefs do not record that review; the 2-to-4 change above came from a separate ops record.

## Lessons and small tricks

- **A limit stored on first use is database state.** Once the capacity sat in a database row, the env value only described the wanted state. Changing it needed a command that rewrites the row; a restart left the row as it was.
- **Change a semaphore's capacity only while it is empty.** Refusing `set-capacity` while a reservation is out means no run ever holds a permit from a pool whose size changed under it.
- **A queue position must count every slot.** With N slots the run starts when the runs ahead of it leave fewer than N permits taken, so the count subtracts N - 1, not 0.
- **Measure parallel runs against both baselines.** The single-run time (98.0 s for A) shows what sharing the host costs each run (5.9 s); the serial estimate (195 s) shows the gain.

## Related

- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[yagni-and-designing-for-present-requirements]]
- [[Lease]] · [[PR]]
