---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# Drawing module boundaries

When you break a system into small units at design time, the core question is where to draw the boundary.

## When to use
Any time you're splitting modules, files, or services. A file that keeps growing is usually a sign the boundary needs to be redrawn.

## How
For each unit, you should first be able to answer three questions clearly:
1. What it does (its single responsibility, in one sentence).
2. How to use it (what its external interface looks like).
3. What it depends on.

Then check the boundary against two criteria:
- **Can someone else tell what it does without reading the implementation?** If not, the interface isn't designed well.
- **Can you change its internals without affecting callers?** If not, the boundary is leaking implementation details.

==Split by reason for change, not by forcing a split along technical layers.== Things that change together belong together; unrelated things get separated.

## Why it works
A good boundary means you only need to hold one unit in your head at a time — the blast radius of a change is contained, and it's easy to test. In a system with bad boundaries, changing one thing breaks a bunch of others because implementation details leaked through the interface.

## Caveats / counterexamples
- Don't abstract early for "might need it later" ([[yagni-and-designing-for-present-requirements|YAGNI and designing for present requirements]]). Boundaries grow out of real requirements, not guesses made in advance.
- Don't swing to the other extreme either — splitting things too finely leaves nothing but glue code between units. Good enough is good enough.

## Source cases
- [[debugging-and-design-method]]

## Related
- [[yagni-and-designing-for-present-requirements]]
- [[ADR]]
