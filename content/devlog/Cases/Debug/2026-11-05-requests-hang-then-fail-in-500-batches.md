---
type: case-debug
date: 2026-11-05
tags: [debug, backend, db, python, fastapi, sqlalchemy, sqlite]
status: solved
publish: true
---
# Requests hang, then fail in batches of HTTP 500 every 30 s

On the ▒▒▒▒ trial stack (FastAPI on a file-backed SQLite database), every request hung and then failed in batches of HTTP 500, one batch every 30 s. The cause was a **deadlock** between two pools: the worker threads and the database connections waited on each other. A deadlock is a state where each party holds something the other needs, so none of them can move.

==A request gives its connection back in teardown, and teardown needs a worker thread. When every worker thread is busy waiting for a connection, no connection can come back.== Only the 30 s pool timeout broke the wait, and the browser's retries rebuilt it straight away.

The fix, [[PR]] ▒▒▒▒, removed the connection pool for file SQLite and stopped writing on every poll.

## Observed symptoms

- Window: 2026-11-05 01:34-01:45 UTC.
- Every request hung. Every 30 s a whole batch returned HTTP 500.
- `GET /api/v1/version`, which never touches the database, hung too.
- Restarting the service did not help.

The log line:

```
sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00
```

The numbers involved:

| Item | Value |
| --- | --- |
| Worker threads | 40 (anyio default) |
| Connection pool | `QueuePool`, 5 fixed + 10 overflow = 15 connections |
| `pool_timeout` | 30 s |
| Polling | every browser tab, every 2 s; each poll writes `last_trusted_at` |
| One write to disk | ~40 ms (an estimate, the only estimated value) |
| Writes before the fix | 4 tabs = 2 polls/s = 120 writes/min |
| Smallest burst that locks | 40 + 15 = 55 requests at once |

## Reproduction

The incident was reproduced in a model, not on the live stack. The model is a small simulation with the same thread count, pool size, timeout and polling rate, stepped every 50 ms. Its self-check asserts these results:

| Load | Result in the model |
| --- | --- |
| Steady polling only, 1, 4 or 8 tabs, 120 s | never locks; no timeout batch |
| One burst of 55 requests, 1, 4 or 8 tabs | 40/40 threads held, 15/15 connections out, pool timer running |
| The same, 125 s later | a timeout batch about every 30 s; still locked after the retries |
| Fix on, 8 tabs | threads near zero, no connection out, 1 write per 60 s, no timeout batch |

A burst of that size comes from a restart, or from every tab reconnecting at the same moment. In the explainer's run, a burst of 55 at 3 s locks the system about 0.7 s later. The pool timeout fires at 33.7 s, the whole batch fails, and the retries lock it again at once.

Two interactive explainers drive their numbers from this model: [the isometric figure](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.isometric.html) and [the component flow](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.flow.html). The flow page loads React and React Flow from esm.sh, so it needs a network connection.

## Investigation timeline

The source material records each decision and its evidence. The commands run between them are not recorded.

1. **Restart.** The service was restarted during the incident. It did not help. As the model later showed, a restart is itself a burst: every client reconnects at once.

2. **Lower the prediction concurrency from 20 to 1.** This was only a stopgap. On 11/06 at 06:25 UTC the stack locked again with concurrency at 1. **Concurrency was therefore not the cause.**

3. **Read the log line.** `QueuePool limit of size 5 overflow 10 reached` means all 15 connections were checked out. A checkout is the act of borrowing a connection from the pool; the borrower holds it until it gives it back. But `GET /api/v1/version` needs no connection and still hung. So the shortage was not only in the connection pool.

4. **Count the thread hops per request.** The routes are synchronous (`def`, not `async def`). FastAPI runs synchronous code on anyio's worker thread pool, 40 threads by default. The database session comes from a synchronous generator dependency, a `def` that `yield`s the session; the code after the `yield` is the teardown that returns the connection. The routes also declare a `response_model`, which FastAPI validates against the return value. Together, each request takes a worker thread three times:

   | Hop | Work |
   | --- | --- |
   | 1 | run the route; check out a connection |
   | 2 | validate the response against `response_model` |
   | 3 | teardown: give the connection back to the pool |

   Between hops the request releases its thread and queues for another. New requests and teardowns queue for threads in arrival order (anyio's limiter is FIFO, first in, first out).

5. **Find the write on every read.** The permission check `policy()` runs on every read request. On every poll it ran `BEGIN IMMEDIATE`, `UPDATE trial_installations.last_trusted_at`, a commit and an fsync. `BEGIN IMMEDIATE` takes SQLite's write lock at the start of the transaction, and fsync forces the write to disk. SQLite allows one writer at a time, so all polls queued for the write lock. While queued, each poll kept its connection and its thread.

6. **Model it.** The model answered which load locks the system. Steady polling at ~40 ms per write never does, even at 8 tabs. A burst of 55 or more does, every time. This matched the symptoms: the trigger is a burst, and concurrency 1 cannot prevent one.

## Root cause

A connection is returned only by teardown, and teardown needs a worker thread. With 40 threads and 15 connections, a burst of 55 requests fills both:

1. The first 40 requests take all 40 threads. 15 of them check out the 15 connections.
2. Those 15 finish their route and release their threads. Their teardowns join the thread queue.
3. The 15 remaining burst requests arrived earlier, so FIFO gives them the freed threads first. They wait for a connection.
4. Now 40 threads wait for a connection, and the 15 connections wait for teardowns that wait for a thread.

![Wait cycle between worker threads and the connection pool](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.wait-cycle.svg)

A checkout is not a [[Lease]]: it has no expiry. The only exit is `pool_timeout`. After 30 s it fails every waiter with `sqlalchemy.exc.TimeoutError`, and the whole batch returns HTTP 500. The browser retries the batch, which is another burst of the same size, so the stack locks again.

![Relock loop from burst to timeout to retry](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.relock-loop.svg)

The write on every poll made each request hold its connection and thread longer. In the model it does not lock the system without a burst.

## Fix

PR ▒▒▒▒, deployed on 11/06 at 07:17 UTC:

| Change | Before | After |
| --- | --- | --- |
| Pool for file SQLite | `QueuePool` 5 + 10, `pool_timeout` 30 s | `NullPool`: no pool, each request opens its own connection |
| SQLite busy timeout | 5 s | 30 s |
| Pool for PostgreSQL | not recorded | 10 + 30 = 40, no fewer than the 40 threads, `pool_timeout` 5 s |
| `policy()` | write lock on every read | reads without a lock |
| `last_trusted_at` | written on every poll | written at most once per 60 s |

`NullPool` opens a connection when a request asks for one and closes it in teardown. There is no shared set of connections, so no request waits for another request's teardown. That removes the wait-for-connection edge from the cycle. A writer now waits only inside SQLite's busy timeout, the time SQLite lets a writer wait for the write lock before it fails.

![Request path after the fix](../../Diagrams/2026-11-05-requests-hang-then-fail-in-500-batches.after-fix.svg)

After the fix the prediction concurrency went back from 1 to 20.

## Lessons and small tricks

- **A pool that is refilled by work running on another pool can deadlock with it.** Here connections came back only on worker threads. Either remove the pool, as `NullPool` does for file SQLite, or give it at least as many connections as there are threads, as the PostgreSQL pool now has.
- **A stopgap that works is not evidence of a cause.** Lowering concurrency from 20 to 1 was only a stopgap; the recurrence at concurrency 1 ruled concurrency out.
- **If a route that never touches the database hangs, something besides the database has run out.** `GET /api/v1/version` hanging was the first sign that threads, not only connections, had run out.
- **A small model can stand in for a [[repro]].** Steady load versus a burst separated "too much traffic" from "a burst of a certain size", and the threshold (40 + 15) came out of the model. See [[reproduce-before-fixing-verify-after]].
- **Check what a read path writes.** A permission check that wrote and fsynced on every poll put every reader in the single-writer queue.

## Related

- [[reproduce-before-fixing-verify-after]]
- [[systematic-troubleshooting]]
- [[Lease]] · [[repro]] · [[PR]]
