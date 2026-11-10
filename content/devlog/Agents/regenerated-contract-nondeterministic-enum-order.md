---
type: agent-lesson
date: 2026-11-04
tags: [openapi, codegen, ci-cd]
---
# Commit only the regenerated contract hunks your change explains

**Mistake**: ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ PR ▒▒▒▒ regenerated `agent_docs/2026-08-12-fullstack-chat/api-contract.yaml` with `scripts/▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` on the Mac. The dump also flipped an unrelated `Source` enum from `mock, real` to `real, mock`. The agent saw the flip and decided the committed YAML was stale. So the flip went into the feature commit. CI regenerated the contract and ran `git diff --exit-code`. That check failed `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` on that one hunk.

**Root cause**: the enum order in the generated OpenAPI contract is non-deterministic, for a known reason. ==`StructurePredictionReportItem.source` is `Literal["real", "mock"]`, while every other model uses `Literal["mock", "real"]`.== The dump merges same-named enum schemas, so the merged `Source` enum can come out in either order.

![Enum flip](../Diagrams/regenerated-contract-nondeterministic-enum-order.enum-flip.svg)

**Rule going forward**:
- After regenerating a contract, diff it against `main`. Keep only the hunks your change explains.
- Revert every other hunk to main's text, even when the local generator produces it.
- A hunk that flips between machines is a generator bug, not a stale file. Fix it at the source, in a separate small PR: align duplicate `Literal[...]` orders so that same-named enums are identical.

**Source**: [[2026-11-04-structure-assistant-submit-recovery-and-abandon]] (full case, with the investigation timeline).
