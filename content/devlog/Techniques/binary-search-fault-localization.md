---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# Binary search fault localization

When you don't know which segment of a long chain a problem is in, cut it in half, check whether the problem is in the first half or the second, and keep halving.

## When to use
- A problem somewhere along a long chain: a request goes frontend → gateway → service → DB, and you don't know which hop is broken.
- A large block of code where you don't know which line introduced the problem.
- A span of history where you don't know which commit introduced the regression (this is [[bisect]]).
- A large config or input where you don't know which part triggers the bug.

## How
1. Find one point that's definitely "good" and one that's definitely "bad."
2. Insert an observation point in the middle (a log line, a breakpoint, `curl`-ing an intermediate node, commenting out half the code).
3. Check whether the problem falls in the first half or the second, and discard the half without the problem.
4. Repeat until the range is small enough to spot at a glance.

## Why it works
==Each cut halves the range, so N segments only take about log2(N) steps.== Finding a regression among 100 commits takes just 7 steps — an order of magnitude faster than checking them one by one.

## Caveats / counterexamples
- This assumes the problem is monotonic: stably bad past some point. If it's intermittent or doesn't reproduce reliably, binary search will misjudge — stabilize the repro first.
- The good/bad criterion has to stay consistent, or the search will drift off course.

## Source cases
- [[debugging-and-design-method]]

## Related
- [[systematic-troubleshooting]]
- [[locating-regressions-with-git-bisect]]
- [[bisect]]
