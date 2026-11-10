---
type: agent-lesson
date: 2026-09-06
tags: [claude-code, hooks, python, ruff]
---
# A post-edit formatter hook deletes an import added before its first use

**Mistake**: edit one added `ModelRun, OptimizationRun` to the import line of
`repositories/workspaces.py`; edit two, seconds later, added the function that
used them. The test run then failed with
`NameError: name 'ModelRun' is not defined` in a test far from the import.

**Root cause**: the repository's PostToolUse hook runs `ruff check --fix` and
`ruff format` after every `Edit`/`Write`. Between the two edits the import was
unused, so ruff's F401 autofix removed it. The harness note "PostToolUse hook
modified the file after your edit" was the only sign, and it reads like a
harmless reformat.

**Rule going forward**:
- Add an import and its first use in the same `Edit` (or the same patch
  script), never as two separate tool calls.
- After any multi-edit sequence in a hooked repo, grep the import line before
  running tests: `grep -n "^from ..models import" <file>`.
- When a `NameError` appears for a symbol you are sure you imported, suspect
  the hook before suspecting the code.

**Source**: ▒▒▒▒▒▒▒▒ (full case, with the wrong turns).
