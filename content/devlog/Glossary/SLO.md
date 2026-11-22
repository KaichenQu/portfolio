---
type: glossary
tags: [glossary]
---
# SLO

**Full name**: Service Level Objective

An internal target set stricter than the external [[SLA]], to leave margin. E.g. commit 99.9% externally, target 99.95% internally, so a real problem doesn't immediately breach the SLA.

![A stricter internal objective creates room to investigate before breaching a looser external availability commitment.](../Diagrams/slo.internal-margin.svg)

Example usage:
> SLO is set at 99.95% — breach it two weeks running and it's time to investigate capacity.

## Related
- [[SLA]]
- [[SLI]]
