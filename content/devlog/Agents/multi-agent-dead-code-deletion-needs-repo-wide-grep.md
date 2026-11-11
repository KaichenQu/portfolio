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

A later cleanup PR in a team repo found the opposite case: code that was
provably dead (no caller anywhere in the repo) but not the owner's to delete.
A symbol with no caller was listed as the owner's because `git blame` on its
current file named the owner's commit; that commit had only moved it, and
`git log -S<symbol>` across the whole history showed a teammate's PR had
introduced it. A teammate's PR merged the day before the audit also carried
22 unused CSS classes and unused exports, wiring still to come.

**Root cause**: file-ownership splits guarantee "only one agent writes this
file," not "only one agent's markup uses this class." Shared UI recipes
(a segmented control used by multiple panes) have no owner in an
ownership-by-file model, so any agent can delete them believing they're local
dead code, when another agent's file across the split still depends on them.
In a team repo the same gap runs between people: a grep proves nobody calls
the code today, not that its author is finished with it, and a deletion in a
file an open PR edits becomes that author's merge conflict.

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
- In a team repo, proof that code is dead is not permission to delete it.
  Before deleting, find who first introduced it with
  `git log -S<symbol> --format='%h %an %ad %s' --date=short` and no path
  filter (the last line is the introducing commit; a path filter or
  `git blame` reports the commit that moved the file), and list the files of
  every open PR (`gh pr list --state open`, then
  `gh pr view <n> --json files -q '.files[].path'`). Delete only code the
  requester introduced, in files no open PR touches. Put a teammate's code, or
  anything in a file an open PR touches, on a deferred list with author,
  evidence, reason and the trigger that would make it deletable.

**Source**: [[2026-07-10-quiet-desk-redesign-four-parallel-agents]] (full case, with the investigation timeline).
The ownership half is from ▒▒▒▒▒▒▒▒.
The deletion-list half is from ▒▒▒▒▒▒▒▒ — same topic
(verify before deleting), different failure: not "who else uses it" but "what else is part
of it".
