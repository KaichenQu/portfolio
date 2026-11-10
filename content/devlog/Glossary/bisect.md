---
type: glossary
tags: [glossary]
---
# bisect

**Full name**: git bisect

Binary search through history to quickly find which commit introduced a [[regression]]. Mark a known-good and a known-bad version; git bisects automatically, and at each step you just answer whether that version is good or bad. N commits take about log2(N) steps.

Example usage:
> Found the regression in 200 commits — bisect nailed it in 8 steps.

See the [[git]] cheatsheet and [[locating-regressions-with-git-bisect]] for the full workflow.

## Related
- [[regression]]
- [[git]]
- [[locating-regressions-with-git-bisect]]
