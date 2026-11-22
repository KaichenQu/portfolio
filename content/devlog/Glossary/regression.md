---
type: glossary
tags: [glossary]
---
# regression

Previously working functionality broken by some change. The typical tool for finding which change introduced a regression is [[bisect]].

![A regression breaks behavior that previously worked. Bisection narrows the range between a working and broken version to the introducing change.](../Diagrams/regression.first-breaking-change.svg)

Example usage:
> This is a regression — it worked in the last version. Run git bisect to find the commit.

## Related
- [[bisect]]
- [[repro]]
- [[RCA]]
