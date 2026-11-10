---
type: agent-lesson
date: 2026-07-10
tags: [frontend, css, multi-agent]
---
# Deleting "dead" shared CSS in a multi-agent file split needs a repo-wide grep, not a local one

**Mistake**: in a 4-agent parallel redesign split by disjoint file ownership, the
live-workstation agent removed a model-toggle control and deleted
`.seg-ctrl`/`.seg-btn` from `live.css` as dead code. It checked only the files
it owned. `SectorHeatmap.tsx`, owned by a different agent, still used those
classes; `heatmap.css` only carried override rules on top of them. Once the
base rules were gone, the heatmap's mode switcher rendered as unstyled boxes.

**Root cause**: file-ownership splits guarantee "only one agent writes this
file," not "only one agent's markup uses this class." Shared UI recipes
(a segmented control used by multiple panes) have no owner in an
ownership-by-file model, so any agent can delete them believing they're local
dead code, when another agent's file across the split still depends on them.

**Rule going forward**:
- Before deleting a CSS class/selector under a per-file or per-agent
  ownership split, grep the whole repo for it, not just the files you own.
- Shared UI recipes (segmented controls, badges, any pattern reused across
  panes) belong in the shared base stylesheet from the start, not duplicated
  or half-owned inside one pane's file — that alone would have prevented this.
- When a coordinator reviews multi-agent output, a fast check is: for every
  class deleted by one agent, grep it across all agents' files before
  accepting the change.
- Also: derive the deletion list from the filesystem, never by hand. Removing a
  module by a hand-written file list left `scripts/lib/icon-export.test.ts`
  behind, which then failed typecheck with TS2307 — a co-located test is part of
  the unit being deleted, and a hand-built list is exactly where siblings get
  dropped. Enumerate with `git ls-files <dir>` / `rg -l <module>`, and run that
  package's typecheck right after each batch; it is far cheaper than a repo-wide
  check and catches precisely this omission. Use absolute paths for the `git rm`
  itself, since the Bash tool's working directory persists between calls and an
  earlier `cd scripts && ...` silently makes a later relative pathspec fail with
  "did not match any files".

**Source**: [[2026-07-10-quiet-desk-redesign-four-parallel-agents]] (full case, with the investigation timeline).
The deletion-list half is from ▒▒▒▒▒▒▒▒ — same topic
(verify before deleting), different failure: not "who else uses it" but "what else is part
of it".
