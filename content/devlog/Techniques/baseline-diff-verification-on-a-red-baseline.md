---
type: pattern
date: 2026-11-11
tags: [verification, refactoring, ci-cd, method]
---
# Baseline-diff verification on a red baseline

==When the baseline already fails some checks, "no behaviour change" is proved by matching the baseline, not by reaching green.== Run every check at the baseline commit once, then run the same script after every commit and compare exit status and the failure list of each check against that baseline run.

## Trigger scenario

A refactor, cleanup or dependency-neutral change must not change behaviour, and the unchanged tree already has red checks on the machine you work on: failing tests, a missing browser binary, a sandbox that breaks some suites. Requiring green would mean fixing those failures, which is a behaviour change of its own and outside the task.

## Procedure

1. On the baseline commit, run every check into its own directory: one log per check and a summary line of `id`, exit status and duration. Also extract each check's failure list (failing test ids, warning lines without line numbers, diagnostics counts) and the build output's byte totals and content-hashed file names.
2. After each commit, run the same script into a fresh directory. Never edit the script between runs without rerunning the baseline.
3. Compare with a script, not by eye: one SAME or DIFF line per check for exit status, failure-list identity, warning set and counts, and bundle bytes per extension.

```text
== web unit tests
web failure list SAME
== lint warnings (base new)
249 249
lint warning set SAME (line numbers ignored)
```

4. Any DIFF stops the next commit. Explain it before moving on: revert the commit, or show that the difference is noise (step 5).
5. A check that could be noise (a load-sensitive test, a nondeterministic build) is rerun alone, or the baseline is built several times, before the difference is blamed on the change or excused.

## Underlying mechanism

A failing check still produces information: which tests fail, how many warnings, which files the build writes. If the change has no effect, all of it is unchanged. Comparing the full failure list, not just the exit status, catches a commit that fixes one failure and breaks another while the exit code stays 1.

## Caveats and counterexamples

- The comparison is only as good as the baseline's repeatability. Build the baseline three to five times before trusting byte counts or hashes; if outputs alternate, compare against the set of baseline outputs ([[check-build-determinism-before-comparing-bundle-bytes]]).
- Strip line numbers from warning lines before diffing them, or an unrelated edit higher up the file shows as a new warning.
- A check that never ran at baseline has nothing to compare against; record it as "not run at baseline" instead of counting its pass.
- Checks the local stack cannot run (a missing backend, a gated database suite) are not covered. Say so in the result.
- CI can disagree with the local baseline in either direction. Here CI passed tests that failed locally; the local baseline is still what the change is compared against.

## Related

- [[reproduce-before-fixing-verify-after]]
- [[locating-regressions-with-git-bisect]]
- [[CI-CD]]
