---
type: glossary
tags: [glossary, infra, dotfiles]
---
# chezmoi

**Category**: dotfiles management tool

Brings config files in the home directory (`.zshrc`, `.gitconfig`, `~/.claude/`, etc.) under a single git repo, managed and synced across machines. The source repo defaults to `~/.local/share/chezmoi`; filenames there encode state by convention: a `dot_` prefix maps to a target file starting with `.`, a `.tmpl` suffix means the file is a Go template, an `encrypted_` prefix plus `.age`/`.asc` means an encrypted file, and `private_` means restricted permissions.

Common commands:

| Command | What it does |
|---|---|
| `chezmoi status` / `chezmoi diff` | Diff local files against the source repo (two-column status, like git) |
| `chezmoi add` / `chezmoi re-add` | Pull local changes back into the source repo |
| `chezmoi apply` | Render the source repo (templates, decryption) onto the home directory |
| `chezmoi cat <file>` | Print one file's rendered output without applying it — cat before apply |
| `chezmoi encrypt` / `decrypt` | Encrypt/decrypt via [[age]] or gpg |

Templates support functions like `{{ include "..." | decrypt }}` and `{{ keyring ... }}`, commonly used to move secrets out of plaintext.

## Related
- [[age]]
- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
