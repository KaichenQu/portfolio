---
type: agent-lesson
date: 2026-11-21
tags: [frontend, multi-agent, review, css]
---
# A delegated visual change is accepted by opening its screenshots, not by its counts

**Mistake**: a worker team delivered a UI redesign with 248 before/after screenshot pairs, six review rounds of its own and a green full browser tier. The controller was about to merge on that report. Opening nine of the `after` files showed five defects: a toolbar over the price axis, a change figure about 170 px from its price, one index tile on a different ground from the other three, plan cards without padding, and a figure collapsed by default.

![Opening nine after screenshots revealed five visible defects that the reported screenshots and green browser tier had missed.](../Diagrams/review-delegated-visual-work-by-opening-the-screenshots.review-sample.svg)

**Root cause**:
- Tests assert the geometry rules their author thought of. A defect nobody wrote a rule for passes all of them.
- A screenshot count proves the files exist. Nobody on the controller's side had looked at one.

**Rule going forward**:
- Before merging a visual change made by another agent, open a handful of its `after` screenshots at the widest width, and at least one narrow one, for the pages people use most.
- Send what is found as one bounded second round: the file names, the defects, nothing else. Open the same files again before the merge.
- Keep the checks that do not need eyes as well: a diff stat over the paths the brief forbids, the changed lines of tests that existed before, and a hash of anything vendored.

Source: [[2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]
