---
type: pattern
date: 2026-06-20
tags: [debug, git, method]
---
# Locating regressions with git bisect

A concrete application of [[binary-search-fault-localization|binary search fault localization]] to git history: a feature that used to work is now broken (a [[regression]]), and bisect narrows it down to the commit that introduced the problem in just a few steps.

## When to use
"It worked in the last version, now it's broken," and you can write a command or a set of steps that judges good vs. bad.

## How
Manual:
```bash
git bisect start
git bisect bad                 # current (bad)
git bisect good <old-good-commit>  # last known-good version
# git automatically checks out the midpoint; test it, then:
git bisect good   # or bad
# repeat until it reports the first bad commit
git bisect reset  # done, back to the original branch
```

Automatic (least effort when you have a reproducible judge script):
```bash
git bisect start <bad> <good>
git bisect run <test-cmd>   # script exit code 0=good, nonzero=bad, range 1-124
git bisect reset
```

## Why it works
Turns "look through hundreds of commits" into about log2(N) judgments. ==In automatic mode you only need to write one command that can judge good vs. bad; everything else runs on its own.==

## Caveats / counterexamples
- If some commits in the middle don't build, skip them with `git bisect skip`.
- The judgment needs to be stable; a flaky bug will make bisect point at the wrong commit.
- Finding the commit is only the first step — you still need to pin down which specific line in that commit caused it.

## Source cases
- [[debugging-and-design-method]]

## Related
- [[binary-search-fault-localization]]
- [[bisect]]
- [[regression]]
- [[git]]
