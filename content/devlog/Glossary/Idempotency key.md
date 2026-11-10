---
type: glossary
tags: [glossary, backend]
---
# Idempotency key

**Full name**: Idempotency key (client-generated request identifier)

A unique value the client attaches to a request that creates or changes something. The server remembers the key, so a retry that carries the same key returns the original result instead of creating a second object. It solves the lost-response problem: when the client cannot tell whether a request arrived, it can resend safely.

Example usage:
> The structure assistant generates `createId` before the first `POST /works` and persists it. A retry after a lost response reuses `createId`, and the server resolves it to the same Work instead of creating a duplicate.

## Related
- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[persist-id-before-next-step]]
