---
type: case-design
date: 2026-11-21
tags: [design, frontend, multi-agent, ci, playwright, css, motion]
status: solved
publish: true
---
# Acceptance gates for a UI redesign built by another agent team

The web UI of `kairotrade-desk` was redone with four depth levels and a motion kit. A Codex lead and its workers wrote all of it; the controller, a Claude session, wrote the issue and the brief, accepted the work, merged and deployed. The release is commit `a4938a7b` on `main`, and production serves it.

==The worker's evidence was 248 screenshot pairs, six review rounds and a green local run, and it still carried five visible defects and two tests that fail on the CI platform.== Three gates caught what the worker's own checks missed: the controller opening the screenshots, the full test tier on Linux, and a byte comparison of the vendored kit. This note records which gate caught what, and the two decisions that went against the plan.

## Background and constraints

The request was one sentence: redo the pages after the ▒▒▒▒ Design site (Motion Kit 0.1.0, 26 effects and two exploded figures), using Codex only, then merge and deploy without asking.

| Item | Value |
| --- | --- |
| Scope | every route in `web/`, four widths (1440, 1024, 681, 390), light and dark |
| Unchanged by rule | Go API, routes, feature behaviour, colours, type scale |
| Content Security Policy | `script-src 'self' https://cdn.plaid.com`, no new host allowed |
| Pull request tier | smoke subset, 5 specs |
| Push tier on `main` and `integration/**` | full Chromium tier on a self-hosted Linux arm64 runner |
| Frontend deploy | Vercel CLI by hand; the API deploys from the `main` workflow |
| Merge rights | workers never merge; the controller does |

The controller and the worker lead ran in separate [[worktree|worktrees]] and talked through files: a brief, a one-line progress file, a report ending in a marker string (`DEPTH-REPORT-COMPLETE`), and a screenshot folder. A background loop waited for the marker.

## Pipeline

| Gate | Who runs it | What it checks | What it caught here |
| --- | --- | --- | --- |
| Worker's local tier | Codex | unit tests, typecheck, full Chromium tier on macOS, a pre-push review script | 6 rounds of its own findings, among them a stale index quote and a lost exit animation |
| [[PR]] check | CI | smoke tier | nothing |
| Diff boundaries | controller | `git diff --stat` over paths the brief forbids | nothing; `internal/`, `cmd/`, `scripts/`, `.github/`, `vercel.json` and the package files were untouched |
| Vendored bytes | controller | SHA-256 of the kit files against upstream | nothing; equal |
| Screenshots | controller | nine `after` files opened and looked at | 5 defects |
| Integration push | CI | full Chromium tier on Linux | 2 failing tests |
| Production | controller | `version.json`, kit hashes, the policy header, a headless load of two pages | nothing |

## Candidate options

### Option A, four pull requests

- Approach: the brief's plan. Foundation, then shell and home, then desk and research, then the remaining pages and figures; each PR near 400 changed lines, none near 1000.
- Pros: each PR small enough to read line by line.
- Cost: the shared primitives (`Motion`, `Number`, `OverlayPresence`, `routeMotion.tsx`) change while their consumers are being built, so the first PR would have been merged before anything proved it.

### Option B, one pull request

- Approach: what the lead delivered. PR #290, +5773/-392 over 117 files, head `9a6d0488`, later `afe3877e`.
- Pros: the primitives and every consumer were verified together, once: one screenshot set, one full-tier run.
- Cost: far past the repository's split line. Nobody read 5773 lines one by one.

## Decision

The single PR was accepted. Splitting it after the fact would have meant redoing 248 screenshot pairs and four full-tier runs to arrive at the same tree. The cost was covered by narrower checks instead of a line-by-line read:

```bash
R=origin/integration/▒▒▒▒▒▒▒▒▒▒▒▒...origin/feat/depth-1-foundation
git diff --stat $R -- internal cmd src scripts .github supabase vercel.json web/package.json web/package-lock.json package.json package-lock.json
git diff -U0 $R -- tests/settings.spec.js tests/unit/pwa-worker.test.js tests/chart-studio.spec.js tests/monetization.spec.js tests/workspace-navigation.spec.js
```

The first command printed nothing. The second listed every changed line in tests that existed before, so a weakened assertion would have shown. The largest new modules were read whole, `web/src/lib/routeMotion.tsx` (334 lines) first, because it replaces the router's history object.

The deviation is written on the issue with its reason. The repository rule that a PR stays near 400 lines did not change.

## Vendored kit

The policy header allows scripts from the site itself and one payment host. Adding the design site's host would have been one line, and every later kit release would then run in production unreviewed. The kit is copied to `web/public/kit/0.1.0/` and compared by hash at review and again in production. The output follows the loop, `motion.css` then `motion.js`:

```bash
for f in motion.css motion.js; do curl -sS "https://design.▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒.com/kit/0.1.0/$f" | shasum -a 256; done
```

```text
5930dd92e525a8f300386d9fcf86401f9944cb9b6651ac41ce8e53a58c76b48e  -
584386622ed9a1ef9e6d82ed5a72d72f5f9b88b59b51195e54cb8c0861354a45  -
```

A size check through the command wrapper in this shell reported the same byte count for both files, which was the wrapper's output and not the files'. Only the hashes were used as evidence.

## Screenshots

The report said the redesign was done and reviewed. The controller opened nine `after` files and found five defects in them:

| Screenshot | Defect |
| --- | --- |
| `desk-1440-dark-after.png` | the chart toolbar covered the top tick of the price axis |
| `desk-1440-dark-after.png` | the change figure sat about 170 px away from the price |
| `home-1440-light-after.png` | one index tile had a white ground and three a grey one |
| `plans-dialog-1440-light-after.png` | plan cards had no padding, and the figure pushed the prices down |
| `login-1440-dark-after.png` | the exploded figure was collapsed by default |

All five passed every automated check, because the tests assert geometry rules the worker thought of, and these were not among them. A second brief named the files and the five defects and nothing else. A fresh lead fixed them in about 40 minutes, 11 commits, and the same files were opened again before the merge.

## Linux full tier

The PR check on #290 was green, and so was the release PR's own check. The push run on the integration branch was not:

```text
44976906277  pull_request  success  a5b9812f
44976896498  push          failure  a5b9812f

1) [chromium] › tests/motion-kit.spec.js:54:1 › late body portal receives kit initialization once
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 1
    Received: 0
```

A Codex worker diagnosed both failures and reproduced them in a [[Playwright]] Linux arm64 container on the same Mac. Both were assumptions in the tests:

| Test | Assumption | Fact |
| --- | --- | --- |
| `late body portal receives kit initialization once` | a non-empty `#root` means React has mounted | `web/src/main.tsx:52` writes a placeholder into `#root` before `initializeSupabase()` resolves, and the kit's observer on `body` is attached on mount |
| `strategy tilt and spotlight reset on live touch and unmount` | ending touch emulation over the DevTools protocol restores a fine pointer | headless Chromium on Linux goes to `hover: none` and `pointer: none` afterwards, so the `change` event the test waits for never fires; macOS returns to `hover: hover` and `pointer: fine` |

The fix is commit `50379810`, 13 lines added and 7 removed in `tests/motion-kit.spec.js`. The portal test waits for the app's own preview helper. The tilt test maps the hover and pointer queries onto `prefers-contrast` with `page.addInitScript` and switches it with `page.emulateMedia`, which fires a real `MediaQueryList` event on every platform. No assertion was removed.

| Run | Platform | Passed | Failed | Skipped |
| --- | --- | --- | --- | --- |
| 44976896498 | Linux arm64, first integration push | 1196 | 2 | 3 |
| 44979169479 | Linux arm64, after `50379810` | 1198 | 0 | 3 |
| local | macOS | 1198 | 0 | 3 |

The baseline was red before any of this: the run on the untouched integration branch failed on a date-dependent test, `tests/ticker-tape.spec.js:332`. The fix for it, a pinned fixture date, went into #290, and results were read against that baseline ([[baseline-diff-verification-on-a-red-baseline]]).

## Wrong turns

### A model id from a rules file

The worker's rules named its models with version numbers. The launch used the id written there. The owner asked 17 minutes after the launch why the lead was not on the newer model; the install's own list had it:

```bash
jq -r '.models[] | select(.visibility=="list") | .slug' ~/.codex/models_cache.json
```

The rules now name families only, and the id comes from that file at launch ([[config-on-disk-is-not-config-in-effect]]).

### A picker that saves the default

Switching the running lead through its `/model` picker also rewrote the global default in `~/.codex/config.toml`, which every later session on the machine would have inherited. The line was restored by hand. A second trap sat in the same step: sending `/model` with an automatic Enter confirmed the first entry in the list for one turn.

### An acceptance criterion stricter than the code

The issue said new motion may change only translate, scale, rotate, opacity and clip-path. Two hover states, a heatmap tile and a scan table row, transition colour through a token the project already had. Colour does not move layout, and existing controls did the same, so the criterion was reworded on the issue with the reason, instead of ticking it as written.

## Out of scope (YAGNI)

- Restoring focus by strategy identity after the list reorders (`routeMotion.tsx` restores by position). It waits for a report that focus landed elsewhere.
- The case where `motion.js` loads and `motion.css` does not, in the redeem dialog. It goes with the next change to that dialog or to the offline cache.
- Replacing `UNSAFE_createBrowserHistory`. It needs a full browser-tier run before any router upgrade, not a rewrite now.

## Lessons and small tricks

- A worker's counts show that its checks ran, and five visible defects passed all of them. The controller opens a sample of the screenshots before the merge ([[review-delegated-visual-work-by-opening-the-screenshots]]).
- A test that emulates touch or pointer capability can pass on macOS and fail on Linux headless. It runs on the CI platform before it counts as done ([[pointer-media-after-touch-emulation-differs-on-linux-headless]]).
- The PR check and the push check are different tiers here. A release waits for the push run on the integration branch, even when every badge on the PR is green.
- A deviation from the plan is recorded where the plan lives, with its reason, the same day.
- A second round is one brief with file names and a fixed list. It took about 40 minutes; the first round took about four and a half hours from launch to its PR check.

## Related

- [[2026-10-26-self-hosted-ci-on-shared-mac-mini]]
- [[2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[parallel-claude-code-sessions-with-git-worktrees]]
- [[reproduce-before-fixing-verify-after]]
- [[CI-CD]] · [[PR]] · [[Playwright]] · [[worktree]]
