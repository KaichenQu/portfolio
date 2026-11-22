---
type: agent-lesson
date: 2026-11-21
tags: [frontend, playwright, ci, testing]
---
# Pointer media after touch emulation is platform-dependent, and a non-empty root is not a mounted app

**Mistake**: two new Playwright tests passed in the full tier on macOS and failed on the Linux arm64 CI runner. One switched touch emulation on and off over the DevTools protocol and waited for the `(hover: hover) and (pointer: fine)` query to fire `change` a second time. The other treated a non-empty `#root` as proof that React had mounted, then clicked and counted ripples: expected 1, received 0. The pull request check ran the smoke tier only, so both reached the integration branch.

**Root cause**:
- After touch emulation ends, headless Chromium on Linux reports `hover: none` and `pointer: none`. macOS goes back to `hover: hover` and `pointer: fine`. The second `change` event never fires on Linux.
- The entry file wrote a placeholder into `#root` before an async config call resolved, so the root was non-empty while nothing was mounted.

**Rule going forward**:
- Drive capability switches with a media feature Playwright can emulate on every platform: map the hover and pointer queries onto `prefers-contrast` in `page.addInitScript`, then switch with `page.emulateMedia`. Keep one separate test on a real touch context for the coarse-pointer path.
- Wait for something the mounted app renders, never for the root element having children.
- Run new pointer, hover or touch tests on the CI platform before reporting done. A Playwright Linux container on the same machine reproduces these failures.
- When the pull request check is a subset, find the event that runs the full tier (here a push to `integration/**`) and read that run before a release merge.

Source: [[2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]
