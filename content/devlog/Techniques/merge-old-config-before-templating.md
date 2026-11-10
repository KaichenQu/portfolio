---
type: trick
date: 2026-06-29
tags: [infra, chezmoi]
---
# Merge the old config into the template before switching to template generation

When a tool's config starts out as a hand-written file and you switch it to template generation (e.g. adding a `.chezmoi.toml.tmpl` for [[chezmoi]]), the first `init`/`generate` overwrites that file entirely with the template's output. Before you do that, merge every section of the hand-written config — encrypted blocks, source paths, various toggles — into the template piece by piece. Otherwise it gets wiped out on the first run, and since the hand-written file is usually not in git, there's no getting it back.

## Related
- [[chezmoi]]
- [[2026-06-29-chezmoi-platform-template-breaks-decryption]]
