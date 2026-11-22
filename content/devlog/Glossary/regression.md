---
type: glossary
tags: [glossary]
---
# regression

Previously working functionality broken by some change. The typical tool for finding which change introduced a regression is [[bisect]].

![A working release and a broken release bound the search, and git bisect identifies the first commit that changed the behavior.](../Diagrams/regression.first-breaking-change.svg)

Example usage:
> This is a regression — it worked in the last version. Run git bisect to find the commit.

## Related
- [[bisect]]
- [[repro]]
- [[RCA]]
