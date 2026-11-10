---
type: agent-lesson
date: 2026-06-29
tags: [chezmoi, config]
---
# Adding a config template overwrites a hand-written config file

**Mistake**: Added `.chezmoi.toml.tmpl` to a chezmoi source whose config was previously hand-written at `~/.config/chezmoi/chezmoi.toml` and contained an `[age]` encryption block. Ran `chezmoi init` to pick up new `[data]` vars; init regenerated the whole config from the template, which had only `[data]`, silently dropping `[age]`. Result: `decrypt: encryption not configured` on every apply. The old config was not tracked by git, so it could not be recovered from history.

**Root cause**: A config template is the sole source of the generated config. `chezmoi init` rewrites the target config entirely from it. Any section not present in the template is lost.

**Rule going forward**:
- Before introducing a config template for a tool that had a hand-written config, read the existing config and port every section into the template first (encryption, source dir, options).
- Treat `init`/`generate` that writes a non-tracked file as destructive; back it up or `git diff` the target before running.
- For chezmoi age specifically: the recipient can be recovered from the identity with `age-keygen -y <identity-file>` if the private key still exists.
- Multi-line template control logic: ending every line with `-}}` eats the trailing newline and glues following content (e.g. a `[data]` table header) onto the previous line. Use `{{- end }}` (no trailing dash) where a newline must survive.
- The same trap in reverse: before editing any deployed dotfile directly, run `chezmoi managed` — if the target is managed, edit the source (or `chezmoi re-add` after) or the next `chezmoi apply` reverts the change. Never `re-add` a target rendered from a `.tmpl` (it would flatten the template); edit the template instead.

**Source**: [[2026-06-29-chezmoi-platform-template-breaks-decryption]], [[2026-07-07-unifying-dual-account-claude-config]] (full cases, with the investigation timelines).
