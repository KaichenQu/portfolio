---
type: pattern
date: 2026-11-09
tags: [idempotency, recovery, frontend-state, workflow]
---
# Persist id before next step

==In a multi-step chain that the client drives, write each server-assigned id to durable local storage before sending the request that depends on it.== Durable local storage is client storage that outlives the page's memory, such as `sessionStorage`.

The ids the client holds then bound what the server can hold. Recovery and abandon decisions can be read off local state. They need a server read only in the one ambiguous case.

## Trigger scenario

The client sends a chain of requests, and each step needs the id that the previous step returned. A crash or reload can land between any two steps. Afterwards the client must decide whether to recover the chain or abandon it, and it can only act on ids it still has.

## Procedure

1. Generate the client-side [[Idempotency key]] and freeze the request payload. An idempotency key is a unique value the client attaches to a request, so the server treats a retry as the same request. Persist both before the first request. If the write fails, send nothing.
2. When step k returns id_k, persist id_k before sending step k+1.
3. Retries reuse the persisted keys and ids. They never mint new ones.

![Crash window](../Diagrams/persist-id-before-next-step.crash-window.svg)

## Underlying mechanism

Each write happens before the request that could create something new. So local state always tells you the most the server can hold.

| Local state | Most the server can hold |
| --- | --- |
| nothing persisted | nothing |
| key only | the object created by step 1 |
| id_k, no id_k+1 | the object step k+1 creates, which is inert until step k+2 runs with id_k+1 |
| final id | the finished object; recover by that id |

"Inert" means the object does nothing on its own. It only matters once a later step uses its id.

### Ambiguous case

A lost response for step k+1 leaves the client unsure: the server may hold an object the client never saw.

Before giving up on it, list the children of id_k, the objects the server holds under it. Re-bind any live one, taking it back as the object the chain continues with, instead of assuming none exists.

![Abandon check](../Diagrams/persist-id-before-next-step.abandon-check.svg)

## Caveats and counterexamples

- The step whose response may be lost must create something that does nothing on its own (a draft, a `prepared` record). If it starts work immediately, the bound no longer means "inert".
- The parent must expose a way to list its children, so the ambiguous case can be resolved.
- Storage writes must be synchronous with respect to the next request (`sessionStorage`, a transaction), not a debounced save. A debounced save runs later, so the next request can leave before the id is stored.
- Lease or lock conflicts ([[Lease]]) are retried with the same identity, never with a new one. A lease is a time-limited lock on a shared resource.

## Source cases

- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]: create → prepare → authorize → submit, with `workId` persisted before prepare and `executionId` before authorize/submit. "Abandon" lists the Work's executions first and re-binds a live one.

## Related

- [[Idempotency key]]
- [[Lease]]
