---
type: glossary
tags: [glossary]
---
# ADR

**Full name**: Architecture Decision Record

Records an important technical decision: the context, the constraints at the time, what was chosen, why, and what was rejected. The point is to preserve "why we chose this at the time" for later review. The design cases under `Cases/Design/` in this repo are written in ADR form.

Versus [[RFC]]: an RFC is the discussion draft before a decision; an ADR is the record after the decision is made.

Example usage:
> Why Postgres over Mongo — write an ADR so we don't relitigate it in six months.

## Related
- [[RFC]]
