---
type: case-debug
date: 2026-06-29
tags: [debug, infra, chezmoi]
status: solved
publish: true
---
# decrypt: encryption not configured after adding a chezmoi platform template

## Symptom
Adding platform detection (macOS / Termux) to [[chezmoi]] meant a new config template, `.chezmoi.toml.tmpl`, that computes `isDarwin` and `isTermux`. Verifying after `chezmoi init` hit two errors in sequence.

First, rendering any file at all failed with:

```
chezmoi: template: .chezmoiignore:6:10: executing ".chezmoiignore" at <.isDarwin>: map has no entry for key "isDarwin"
```

Once that was fixed, the second one:

```
chezmoi: .zshrc: template: dot_zshrc.tmpl:200:40: executing "dot_zshrc.tmpl" at <decrypt>: error calling decrypt: encryption not configured
```

`.zshrc` ends with `{{ include "encrypted_secrets.sh.age" | decrypt }}` to decrypt the API keys, and the decryption config had suddenly vanished.

## Reproduction
The source repo `~/.local/share/chezmoi` originally had no config template. Config was hand-written at `~/.config/chezmoi/chezmoi.toml`, carrying the `[age]` block left behind by the previous entry, [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]. After adding `.chezmoi.toml.tmpl`:

```bash
chezmoi init        # regenerates ~/.config/chezmoi/chezmoi.toml from the template
chezmoi cat ~/.zshrc
```

## Investigation timeline

1. The first error, `map has no entry for key "isDarwin"`, means `.isDarwin` never reached data — yet `chezmoi init` reported no error. Inspect the generated config:

   ```bash
   cat ~/.config/chezmoi/chezmoi.toml
   chezmoi data --format=json | python3 -c "import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ['isDarwin','isTermux']})"
   ```

   Key output:

   ```
   # ...com.termux/files/usr).[data]
       isDarwin = true
       isTermux = false
   ```
   ```
   {'isDarwin': None, 'isTermux': None}
   ```

   ==`[data]` had been glued onto the end of a comment line.== The top of my template is a few lines of `{{- ... -}}` detection logic followed by a comment, and the `-}}` on the last `{{- end -}}` also ate the newline after it, so `[data]` landed directly behind `# ...usr).`. TOML treats the whole line as a comment, the two keys become unknown top-level keys, data has neither of them, and `.isDarwin` reports no entry. This is chezmoi template [[whitespace-trimming]] eating the structure.

2. Fix the template: move the comment to after the detection logic and before `[data]`, and change the last end to `{{- end }}` — keep the leading `-` to remove the blank line above it, drop the trailing `-` so the newline survives. Rerun:

   ```bash
   chezmoi init
   chezmoi data --format=json | grep -E 'isDarwin|isTermux'   # isDarwin=true isTermux=false, correct now
   zsh -n <(chezmoi cat ~/.zshrc)
   ```

   The first error is gone, and the second surfaces: `decrypt: encryption not configured`.

3. Think about what those two `chezmoi init` runs actually did. ==They rewrote the whole of `~/.config/chezmoi/chezmoi.toml` from my new template, and that template contains only `[data]` — not the hand-written `[age]` block.== Recipient and identity were both gone, so decryption is, accurately, not configured.

4. Recover the age config. The identity file `key.txt` is still in `~/.config/chezmoi/`, so derive the recipient back from it:

   ```bash
   age-keygen -y ~/.config/chezmoi/key.txt
   # age1uf6w080k5sqjv48ey20ykklkljx7lmp8pjtrvga4c3498rwch4zqkav84h
   ```

   Confirm the old config was never tracked by git and held no other settings — it was only ever introduced in the encryption commit:

   ```bash
   git log --oneline -- '*chezmoi.toml*'   # empty, never tracked
   ```

## Root cause
Two independent root causes, both triggered by "add a config template, then run `chezmoi init`":

- Template [[whitespace-trimming]] (`-}}`) pulled the `[data]` table header onto the end of a comment line. TOML parsed it in the wrong place and data lost both keys.
- ==`chezmoi init` rewrites the entire generated config from the config template.== Config had been hand-written, the template carried no `[age]` block, and a single init run wiped the encryption config out. That hand-written config was not in git, so git could not bring it back; the recipient had to be rebuilt from `key.txt`.

## Fix
In `~/.local/share/chezmoi/.chezmoi.toml.tmpl`:

- Comment after the logic, before `[data]`; `{{- end }}` at the end (see timeline step 2).
- Put `encryption = "age"` and `[age]` at the top of the template — identity `{{ .chezmoi.homeDir }}/.config/chezmoi/key.txt`, recipient restored to `age1uf6w0...`. TOML top-level keys must precede any table header, so `encryption` goes above both `[age]` and `[data]`.

After rerunning `chezmoi init`, `chezmoi cat ~/.zshrc` decrypts correctly and `zsh -n` passes. Rendering with a temporary config that simulates `isDarwin=false` / `isTermux=true` gives the correct Termux branch too.

## Lessons
- Adding a config template to a tool whose config was previously hand-written moves the single source of truth out of the file and into the template. Copy every section of the hand-written file — here `[age]` — into the template before making the move, or the first `init` loses it. Generalised as [[merge-old-config-before-templating]].
- Generated config that looks correct still needs verifying that it takes effect. The config plainly contained `isDarwin = true`, and because `[data]` was misplaced, data simply did not have it. See [[config-on-disk-is-not-config-in-effect]].
- A lost age recipient can be derived back from the identity with `age-keygen -y <identity>`; as long as the private key survives, historical ciphertext is still readable. See [[age]].

## Related
- [[chezmoi]] [[age]] [[whitespace-trimming]]
- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] — the previous entry; the age config it set up is exactly what got wiped here
- [[config-on-disk-is-not-config-in-effect]]
- [[merge-old-config-before-templating]]
