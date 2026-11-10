---
type: agent-lesson
date: 2026-06-29
tags: [git, cli]
---
# git add with a bad pathspec stages nothing, then commit ships the wrong tree

**Mistake**: right after `git mv dot_zshrc dot_zshrc.tmpl`, ran
`git add dot_zshrc dot_zshrc.tmpl encrypted_secrets.sh.age`. The old name
`dot_zshrc` no longer existed, so git printed
`fatal: pathspec 'dot_zshrc' did not match any files` and **staged none of the
three files**. The fatal line was not noticed, the next `git commit` went
ahead, and it committed the index from the earlier `git mv` step — which still
held the pre-edit content (plaintext secrets) and omitted the new encrypted
file entirely.

**Root cause**: `git add` treats its pathspec list atomically. If any one
argument matches nothing, the whole command aborts with a fatal error and
stages nothing — the other valid paths are not added. Mixing an
already-renamed/old path into the same `git add` triggers this silently if you
don't read the error.

**Rule going forward**:
- After a rename, never pass the old name to `git add`. Add only paths that
  currently exist.
- Always confirm what is actually staged with `git status --short` before
  committing, especially when a rename or encryption/secret change is involved.
- For commits that move secrets out of plaintext, verify the committed tree
  itself: `git show HEAD:<file> | grep <secret>` (must be empty) and
  `git ls-tree HEAD --name-only | grep <encrypted-file>` (must be present).
  Do not trust that "the command ran" means "the right thing was committed."

**Source**: [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] (full case, with the investigation timeline).
