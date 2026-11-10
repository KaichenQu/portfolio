---
type: case-design
date: 2026-10-26
tags: [design, infra, ci, github-actions, self-hosted-runner, orbstack, playwright]
status: wip
publish: true
---
# Moving a locked GitHub Actions pipeline onto a shared Mac mini

## Background and constraints

==The GitHub account was locked for a failed payment, so every GitHub-hosted job stopped running. The tests moved to a self-hosted runner on a Mac mini; the deploy jobs did not, and still fail.==

A **GitHub-hosted runner** is a machine GitHub rents out per minute. A **self-hosted runner** is GitHub's runner agent on a machine you own; it takes the jobs that ask for its label.

The repository is `kairotrade-desk`, a trading desk app with a Vite frontend and a Go API. Its CI has two **tiers**, named sets of tests: a smoke tier on pull requests and a full tier on pushes to `main`.

The lock first showed up as a failure with no obvious cause. On 2026-10-26 every run for three [[PR|PRs]] and for `main` failed like this:

```text
run fails in 1 to 3 seconds, zero steps executed
```

A run with zero steps never reached the code, so the cause was in the account. The lock reason GitHub gave:

```text
recent account payments have failed or your spending limit needs to be increased
```

October usage explains why the free allowance was gone:

| Item | Value |
| --- | --- |
| Runs in October | 305 |
| Pull request runs | 200 runs, 2020 minutes |
| Push runs | 105 runs, 1908 minutes |
| Free allowance | 2000 minutes per month |
| One PR run, smoke tier | 11 min, of which [[Playwright]] 196 tests 6.2 min |
| One `main` push, full tier | 23 min, of which Playwright 611 tests 17.8 min |

Pull requests alone used more than the monthly allowance.

Hard constraints:

- The Mac mini is shared. It already runs the `ci-runner` VM for another repository, `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`, inside OrbStack, a macOS app that runs lightweight Linux machines. That setup, its isolation and its scripts are in [[2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]].
- All OrbStack VMs share one global memory pool of 24 GB, out of the machine's 48 GB.
- The billing problem itself was the owner's to fix and was still open when the work ended.

## Candidate options

Codex, used as an adversarial reviewer from another vendor, reviewed the migration plan. The verdict was `SHIP WITH CHANGES`, with four changes. Each change names one part of the draft it replaced.

### Option A, the draft

- Approach: run the new runner inside the existing `ci-runner` VM; keep the six `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` runners as they were; move every job, deploys included, to the Mac mini; let the nightly run stand in for the full tier on `main`.
- Pros: no new VM; one move for all jobs.
- Cost: two repositories share one user and one Docker daemon; memory oversold (below); production credentials on the shared machine; no working full-tier gate on `main`.

The draft itself is not on record; this option is reconstructed from what the four changes reversed.

### Option B, the reviewed plan

| Change | Content |
| --- | --- |
| 1 | Do not share `ci-runner`. Create a separate VM, `kairo-ci`, with its own user and its own Docker |
| 2 | The six `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` runners had historical memory peaks of 3.6, 5.2, 3.6, 5.3, 0.2 and 5.5 GB, which oversold the 24 GB pool. Cut them to 2 and set a limit |
| 3 | Keep the `deploy`, `vercel-settings` and `vercel` jobs on GitHub-hosted runners. Production credentials stay off the Mac mini |
| 4 | Keep the full tier on `main`. The nightly run had failed on each of the last two nights, so it cannot serve as the gate |
| Other | Keep `workers` at 2, keep the `integration/**` trigger, and turn on `cancel-in-progress` for pull requests only |

`cancel-in-progress` is a **concurrency** setting: a new run in the same group cancels the older one still running. Restricting it to pull requests means a push to `main` is never cancelled halfway.

## Decision

==Option B. Tests run on a dedicated VM on the Mac mini; deploys stay on GitHub-hosted runners; `main` keeps the full tier.==

The deciding constraints were memory and credentials. The measured peaks oversold the shared 24 GB pool, so the runner count came from the peaks. Deploys stayed on GitHub-hosted runners because that keeps production credentials off the Mac mini.

The cost of change 3 shows in both `main` runs recorded since: the deploy job still needs GitHub billing, so it keeps failing until the account is fixed.

![Job lanes](../../Diagrams/2026-10-26-self-hosted-ci-on-shared-mac-mini.lanes.svg)

## Module breakdown

The Mac mini after the change:

| Scope | Runners | CPU | Memory |
| --- | --- | --- | --- |
| OrbStack global pool (machine: 18 cores, 48 GB) | 3 | 10 cores | 24 GB |
| `kairo-ci` (Ubuntu 26.04 arm64, user `kairo`, runner `kairo1`, label `kairo-mac-mini`) | 1 | 4 | 8 GB |
| `ci-runner` (`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`; `r1` and `r2` kept, `r3` to `r6` stopped) | 2 | 4 | 12 GB |
| Docker infrastructure (postgres, redis, mongo, mysql, a team bot) | 0 | 2 | 3 GB |

Each VM is a boundary: `kairo-ci` has its own user and its own Docker, so the two repositories no longer share either.

## Data flow

[[PR]] #110 (written by claude2, merged as `51ff5c3`) moved the test jobs. It took four runs on `kairo1`:

| Run | Commit | Result | verify time | Cause |
| --- | --- | --- | --- | --- |
| `40448801349` | `acbc0bc` | failed | 47 s | the interpreter from `setup-python` lacked `LD_LIBRARY_PATH` inside test subprocesses |
| `40449760584` | `289d076` | passed | 4 min 24 s | the venv now uses the machine's own Python 3.14 |
| `40450404304` | `0f03ee6` | failed | 6 s | the repository's `.cache/go-mod` is read-only; checkout cannot clean it in the persistent work directory |
| `40450640862` | `a3451f8` | passed | 4 min 37 s | Go cache moved to `$HOME/.cache/kairo-go` |

The second failure comes from a property of self-hosted runners: the work directory persists between runs. A GitHub-hosted runner starts clean each time; `kairo1` keeps whatever the last run left. The first came from the interpreter that `setup-python` installs, which did not work in test subprocesses on this machine; the machine's own Python did.

## Regressions found on main

==The first full-tier run on `main` after the move found 11 failures that the locked CI had let through.==

```text
618 passed, 11 failed, 5.2 min
```

The cause was PR #108, merged earlier the same day while every Actions run was failing at zero steps. #108 moved the search form into the watchlist panel. After that, two inputs carried the same label, 「股票代码」 ("stock symbol"). Separately, the fixtures of three trading-note tests returned 503 for `/api/bars`.

PR #111 (written by Codex, merged as `8cbca84`) fixed it. The product change was a rename: the add-to-watchlist input became 「添加自选代码」 / "Symbol to add to watchlist".

| Check | Result |
| --- | --- |
| Local, five changed test files | 87 passed |
| Local, full tier | 630 passed, 3 skipped |
| Unit tests | 218 passed |
| `tsc` | passed |
| PR CI on `kairo1` | verify passed, 212 s |
| `main` full tier after merge, run `40453063622` | verify passed, 313 s; Playwright 630 passed in 4.1 min; Go coverage 82.3% |
| `deploy` job in the same run | failed in 2 s (billing lock) |

## Durations before and after

| Run | Runner | Time |
| --- | --- | --- |
| PR, smoke tier, before | GitHub-hosted | 11 min (whole run) |
| `main`, full tier, before | GitHub-hosted | 23 min (whole run); Playwright 611 tests 17.8 min |
| PR #111 | `kairo1` | verify 212 s |
| `main` after #111, run `40453063622` | `kairo1` | verify 313 s; Playwright 630 tests 4.1 min |
| PR #113 (2026-10-27) | `kairo1` | verify 3 min 25 s |
| `main` after #113, run `40475446872` | `kairo1` | verify 5 min 12 s; Playwright 639 tests 4.1 min |

The "before" rows are whole runs and the "after" rows are the verify job, so the two halves are not an exact match. The Playwright lines are comparable: the full tier went from 17.8 min to 4.1 min with more tests.

On 2026-10-27 the `deploy` job of run `40475446872` again failed in 2 s on the billing lock. That feature was frontend-only, so nothing it shipped was waiting on that job.

## Out of scope (YAGNI)

- Fixing GitHub billing. That is the account owner's step. Until then the Go API on production stays at `4f579e6`, and the frontend is deployed by hand with the Vercel CLI.
- The nightly Playwright step. It had failed on GitHub two nights in a row; its first run on `kairo1` was scheduled for the next 03:00 UTC, after this work.

## Lessons and small tricks

- A run that fails in 1 to 3 seconds with zero steps never reached your code. Check the account and billing before reading the workflow.
- Size runners from measured memory peaks against the pool they share. The six `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` runners' peaks oversold the 24 GB pool; two capped runners replaced them.
- Keep deploy jobs, and the production credentials they hold, on GitHub-hosted runners rather than on a shared self-hosted machine. The price is a dependency on hosted billing; here it showed up as a deploy failing in 2 s.
- A gate that is already failing cannot replace another gate. The nightly had been red for two nights, so `main` kept its full tier.
- Merges made while CI is down build up a backlog of [[regression|regressions]]. Run the full tier first thing after CI comes back; here it found 11 failures from one earlier PR.
- A self-hosted runner keeps its work directory. Put tool caches under `$HOME`, not inside the checkout, and prefer the machine's own interpreter over one that a setup action unpacks.

## Related

- [[2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]] (the earlier `ci-runner` VM on the same Mac mini)
- [[CI-CD|CI/CD]] · [[PR]] · [[Playwright]] · [[regression]] · [[e2e]]
