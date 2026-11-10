---
type: agent-lesson
date: 2026-07-25
tags: [config, context-engineering, claude-code]
---
# Before trimming or relocating an always-loaded instruction file, check what content lives ONLY there

**Mistake**: while shrinking globally-loaded context, the plan was to drop
`@/Users/kelsonqu/Obsidian/DevLog/AGENTS.md` from `~/.claude/CLAUDE.md` because 27 of its
66 lines were vault description that is irrelevant outside that vault. Three other
deletions in the same pass had been verified as duplicates of text already present in the
harness system prompt or in the `/devlog` command. This one was assumed to be the same
kind of edit and nearly went out unchecked. Reading `/devlog` first showed it never
mentions `Agents/` at all: the "after writing a case, distill an English lesson into
`Agents/`" workflow existed nowhere but `AGENTS.md:22-26`.

**Root cause**: removing redundant content and removing an import are different operations
that look identical in a diff. Redundant content has a copy elsewhere, so deleting it is
free. An import is a container — dropping it removes everything inside, including whatever
happens to have no second copy. Nothing errors either way, so the two are
indistinguishable at edit time, and the sole-copy case fails silently and on a long delay:
no error, no missing file, just a workflow that quietly stops running until someone
notices months later that the directory stopped growing.

**Rule going forward**:
- Before deleting a block from an always-loaded instruction file, grep for its distinctive
  phrases across the other files that load into the same context (harness prompt, skills,
  slash commands, other imports). Delete only what you found a second copy of.
- Before dropping an `@import` or a whole file, read it and account for every section:
  either it is duplicated elsewhere, or it must be relocated first. `@` imports are
  all-or-nothing — there is no way to import half a file.
- Relocate before removing, never after. Move the sole-copy content to where it actually
  fires (a multi-step procedure belongs in the skill that triggers it, not in a file loaded
  into every session), verify it landed, then change the import.
- Prefer a target that makes the content fire more precisely than its old home did. Here
  the workflow described a follow-up action to `/devlog`, so `/devlog` was a strictly
  better home than a globally-resident file.

**Source**: [[2026-07-25-trimming-claude-md-and-splitting-agents-index]] (full case, with the investigation timeline).
Related but distinct: [[multi-agent-dead-code-deletion-needs-repo-wide-grep]] — that one is
about deleting something another *consumer* still needs; this one is about deleting the
only *copy* of something.
