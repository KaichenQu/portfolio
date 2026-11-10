---
type: agent-lesson
date: 2026-08-13
tags: [hooks, guard, docker, lark]
---
# Widening a hook matcher changes what every existing rule means

**Mistake**: A PreToolUse guard blocked one path substring, `*lark-channel*`, to protect an encrypted keystore. Its matcher originally covered only `Bash`. When the matcher was widened to `Bash|Edit|Write|Read`, the same rules started running against single file paths instead of shell command strings — and the bridge stores chat attachments in `profiles/<p>/media/` under that very tree. Every image a user sent became unreadable, and the agent reported it as "the media directory is off limits to my runtime", which reads like a sandbox or mount problem and sent the next three hours of investigation to the wrong machine.

**Root cause**: A deny rule written as a path substring silently assumes everything under that tree is sensitive. Cache directories and credential stores routinely share a `HOME`, so that assumption is usually false. Widening the matcher did not add a rule; it changed the meaning of the rules already there, and nobody re-read them under the new scope.

Second, smaller trap in the same guard: the matcher regex is unanchored (`new RegExp(pattern).test(name)`), so `Read` also matches `ReadMediaFile`. The script's own dispatch used an exact `case "$TOOL" in Read|Edit|Write)`, so `ReadMediaFile` entered the guard but fell past its file-tool branch onto a catch-all that matched the whole event JSON.

**Rule going forward**:
- When widening a hook matcher to new tools, re-read every existing rule and ask what it now matches. A matcher change is a rule change.
- Before writing a deny rule as a path substring, `ls` the tree. If it holds anything the agent legitimately needs, exempt that subdirectory explicitly instead of opening the tree, and keep the exemption read-only and `..`-free.
- Keep the tool dispatch inside the script consistent with the matcher regex: an unanchored alternation admits names the internal `case` will not match, leaving tools that pass through unhandled.
- Make block messages point at the working alternative ("read it with ReadMediaFile") rather than only refusing. Agents probe with `ls`/`file` first and abandon the task on a bare refusal.
- Diagnose an agent's "I lack permission" claim from the guard's own log, never from its wording — it paraphrases the block message into whatever explanation sounds plausible.

**Source**: [[2026-08-13-feishu-image-blocked-by-overbroad-guard]] (full case, with the investigation timeline).
