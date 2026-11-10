---
type: case-design
date: 2026-10-24
tags: [design, backend, go, retry, third-party-api]
status: solved
---
# Plaid Item removal: retry after verification

KairoTrade uses a Plaid connection to verify a user's account, and needs nothing from it afterwards. The connection should then be removed. Until 10/24 it never was, so every verified connection kept billing.

The final design keeps the access token on the server until removal succeeds. A failed removal goes to an orphan queue: up to 3 tries in all, and a permanent 4xx abandons it at once. ==Each of the three review rounds found a flaw in the previous fix==, and the last flaw found is still open: the queue lives in memory.

Terms used below:

- **Plaid** links an app to a user's bank or brokerage account.
- An **Item** is Plaid's record of one such link. It is billed monthly while it exists.
- The **access token** is the credential the app holds for one Item. Calling `/item/remove` with it deletes the Item.

## Background and constraints

The second full-repo audit (main `2d4a7b3`) listed it as should-level item 7:

```
internal/accounts/connection_security.go:155-159
internal/accounts/aggregators.go:88-99
```

- The Plaid access token is held only in memory.
- It is lost when its entry expires after 24 hours or the process restarts.
- `/item/remove` is never called.

The token had no reader other than removal. So nothing else needed it, but losing it meant the Item could never be removed, and it kept billing every month.

The constraint the rest of the case turns on: ==removal needs the token, so the token has to outlive every failed removal.==

## Candidate options

The audit offered two fixes:

- **A.** In `plaidComplete`, call `plaidRemove` right after verification and keep only the status.
- **B.** Remove the Items one by one during prune and at shutdown.

PR #76 (`audit2-accounts`, claude2) took A, with a bounded retry. The review rounds then changed what "bounded retry" meant.

## Review rounds

| Round | Reviewer | Flaw found | Change |
| --- | --- | --- | --- |
| audit 2 | 3 opus auditors | token only in memory; `/item/remove` never called; the Item bills forever | remove right after verification |
| PR #76 review | Codex | remove right after verification, and a failure drops the token; the Item bills forever | keep the token server-side and retry |
| PR #76 re-review | opus | a permanent 4xx is retried forever; the user's disconnect returns 502 forever | service-level orphan queue, up to 3 tries; a permanent error abandons it and logs `PLAID_REMOVE_ABANDONED`; disconnect no longer waits for Plaid |
| release | — | the orphan queue is in memory and is lost on restart (window about 3 minutes) | not done |

Each fix closed the flaw before it and opened the next one:

1. **Remove immediately** fixed "never removed". It made the token's life as short as one call, so a single failed call leaked the Item exactly as before.
2. **Keep the token and retry** fixed the leak. It retried every failure the same way, including a permanent 4xx, an error that will never succeed. The retry never ended, and the user's disconnect, which waited for it, failed with 502 every time.
3. **Orphan queue with a limit** fixed the endless retry. The token now lives as long as the queue, and the queue lives as long as the process.

PR #76 went through two review rounds by opus and two by Codex, and two fix rounds.

## Decision

The orphan queue:

- holds the token on the server after a failed removal;
- retries the removal, 3 tries in all;
- abandons it on a permanent 4xx and logs `PLAID_REMOVE_ABANDONED`;
- runs at service level, so the user's disconnect returns without waiting for Plaid.

![Item removal states](../../Diagrams/2026-10-24-plaid-item-removal-retry-after-verification.removal-states.svg)

The queue in memory was accepted for this release. A restart inside the retry window loses the queued tokens, and those Items keep billing. The brief puts the window at about 3 minutes.

## Verification

| Check | Result |
| --- | --- |
| `go vet ./...` | clean |
| `go test -race ./...` on the final head of #76 (`a8f509d`) | 10 packages pass |
| release | PR #78 (`integration/audit-2` → main), merge `8051511`; issue #73 closed |

## Out of scope (YAGNI)

- A persistent orphan queue. The brief lists the in-memory queue under "not done", with the restart window above.

## Lessons and small tricks

- Before calling a cleanup that can fail, store what the cleanup needs. If removal needs the token, the token must outlive a failed removal; otherwise one failure leaks the resource for good. This is the same rule as [[persist-id-before-next-step]], applied to a server-side handle.
- A retry needs two limits: a split between transient and permanent errors, and a maximum number of tries. Without the first, a permanent 4xx loops forever.
- A user-facing action should not wait on a third-party cleanup. Disconnect returned 502 forever until the queue took the cleanup off its path.
- Review a fix as a new design. Here every round found a flaw that the previous round's fix had introduced.
- An in-memory queue is only as durable as the process. Write down the window it leaves open, as this release did.

## Related

- [[persist-id-before-next-step]]
- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[yagni-and-designing-for-present-requirements]]
- [[PR]]
