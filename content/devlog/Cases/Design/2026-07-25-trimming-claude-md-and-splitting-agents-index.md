---
type: case-design
date: 2026-07-25
tags: [design, infra, claude-code, context-engineering]
status: solved
---
# Trimming CLAUDE.md under the new context-engineering rules, and splitting AGENTS.md into entry point and index

## Background and constraints

Anthropic's 2026-07-24 post [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) carries one hard number: **deleting more than 80% of the Claude Code system prompt for higher-tier models produced no measurable performance drop**. Three of its five shifts bear directly on local configuration: rules become judgement, delete duplication, disclose progressively.

The official memory docs give a different and more concrete metric:

> **Size: target under 200 lines per CLAUDE.md file.** Longer files consume more context and **reduce adherence**.

Measured load per session: 183 lines / 11 KB. That is `~/.claude/CLAUDE.md` at 90 lines, plus `RTK.md` at 27, plus `DevLog/AGENTS.md` at 66. The latter two arrive through `@` imports, and the docs state explicitly that imported files enter the context at startup — splitting files saves no context by itself.

Two hard constraints:

- **No single file exceeds 200 lines**, so nothing here is over the official limit. The blog's 80% figure describes Claude Code's own system prompt, not a user's CLAUDE.md, and the number does not transfer.
- `AGENTS.md` is a deliberately designed **cross-tool entry point** (Cursor, Codex, and Copilot read that filename by convention). It cannot be dissolved to save context.

## Options considered

### Option A: cut 80% across the board

- Approach: reduce CLAUDE.md to roughly 30 lines, keeping only the purely personal parts — language preference, git format, DevLog trigger.
- Upside: maximum savings.
- Cost: it deletes things the docs **explicitly recommend keeping**. Checking first showed that the eight anti-verbosity rules in Response style are precisely Anthropic's recommended countermeasure for Opus 5. From `prompting-claude-opus-5`:

  > The effort parameter controls how much the model **thinks** rather than how much it **says**: lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly.

  Verbosity in this model generation can only be suppressed by prompting; `effort` will not move it. Cutting those rules is self-harm.

### Option B: delete only what duplicates the harness

- Approach: compare CLAUDE.md line by line against the current system prompt, and delete only what the built-ins already cover.
- Upside: evidence-based, no collateral damage. The docs state that redundant and conflicting instructions **reduce adherence**, not merely cost tokens, so deduplication buys more than a smaller line count.
- Cost: saves little.

### Option C: B, plus lifting the non-global content out of the global import

- Approach: on top of B, deal with the 66 lines of `AGENTS.md`. Its first 27 lines are vault metadata (what this vault is, what `Agents/` is for, the workflow for writing a lesson), useful only while working inside the DevLog repo; the remaining 39 lines are the 8-entry lesson index, useful everywhere.
- Upside: those 27 lines are pure noise in 95% of sessions, so removing them is the most concrete win available.
- Cost: it requires changing the vault structure, and `@` imports are all-or-nothing — half a file cannot be imported.

## Decision

Option C.

**A was rejected, and the constraint that rejected it was "officially recommended"** — an 80% cut deletes things Anthropic itself tells you to keep. That was recovered by checking rather than assuming: reading `prompting-claude-opus-5` first confirmed Response style should stay, and reading the Fable 5 migration guide afterwards showed that the two remaining Code style rules (no error handling for impossible scenarios, no abstractions for one-time operations) are near-verbatim restatements of the officially recommended prompt, so those stay too.

In the end only four items were deleted from CLAUDE.md, each with an identifiable counterpart in the harness:

| Deleted | Covered by |
|---|---|
| The 6-line "When to delegate" section added yesterday | Three synonymous statements in the harness (the Agent tool description, the session-level instructions, the Workflow tool docs) |
| `Don't add comments... to code I didn't change` | The harness built-in `Write code that reads like the surrounding code: match its comment density, naming, and idiom` — which is exactly the blog's "after" example |
| `Don't add features beyond what was asked` | The harness's entire `# Delivering work` section |
| The writing conventions in the DevLog section (emoji / timeline / Glossary) | `/devlog` lines 25, 28, and 38-41, verbatim |

One further item was rewritten rather than deleted. It used to read "never add double-check instructions"; it now reads "strip verification scaffolding when you find it". The Opus 5 guide's own wording is `**Delete** verification instructions`, so turning a deletion instruction into a new prohibition points the wrong way.

## Module split

`AGENTS.md` splits into two files, one responsibility each:

```mermaid
flowchart LR
    subgraph before["Before"]
        A1["AGENTS.md, 66 lines<br/>vault guide + index"] -->|@import, always resident| A2[every session]
    end
    subgraph after["After"]
        B1["AGENTS.md, 31 lines<br/>vault guide only<br/>cross-tool entry point unchanged"] -.on demand.-> B3[humans / other AI tools]
        B2["Agents/INDEX.md, 47 lines<br/>8 lessons only"] -->|@import, always resident| B4[every session]
        B1 -->|link| B2
    end
```

- `AGENTS.md` (31 lines): keeps the full cross-tool entry-point role; the Index section becomes one sentence pointing at `Agents/INDEX.md`.
- `Agents/INDEX.md` (47 lines): the 8-entry lesson index, living in the same directory as the lesson files, with links rewritten as same-level relative paths (Obsidian still resolves them).
- `~/.claude/CLAUDE.md`: the import switches from `AGENTS.md` to `Agents/INDEX.md`.
- `/devlog` gains a step 7, absorbing the Agents/ workflow from the old `AGENTS.md`.

Net effect: always-resident content drops from 183 lines to 150.

## Data flow

The interesting part is the hop that was almost missed. The original plan was to drop `AGENTS.md` from the global import directly; a quick read of `/devlog` beforehand showed that its steps 1 through 7 **never mention `Agents/` at all** — the "distil an English lesson after writing a case" workflow existed only at `AGENTS.md:22-26`.

Following the original plan would have produced no error of any kind. `Agents/` would simply never grow another file again, and that might not surface for weeks.

So the order was inverted: move the workflow into `/devlog` as step 7 first, then touch the import. It reads better in its new home anyway, since it describes what happens after `/devlog` finishes and never belonged in an always-resident file. This is exactly what the memory docs say:

> If an entry is a **multi-step procedure** or only matters for one part of the codebase, move it to a **skill** or a path-scoped rule instead.

A completeness check afterwards confirmed 8/8 links reachable and no orphaned lessons:

```bash
for f in Agents/*.md; do b=$(basename "$f"); [ "$b" = "INDEX.md" ] && continue
  grep -q "($b)" Agents/INDEX.md || echo "  ORPHAN $b"; done
```

## Not done (YAGNI)

- **The lesson summaries were not compressed.** Three to five lines each looks long, but they are **preventive triggers**: reading the summary is already receiving the lesson, with no need to open the file. Compressing one to a bare title ("grep anchor vs ls trailing slash") destroys that trigger — you would never realise the file was worth opening. Forty-seven lines of dense, personally earned mistakes is good context spend; 27 lines of "what this vault is" is not.
- **No `DevLog/CLAUDE.md` was created.** The official pattern is a file containing nothing but `@AGENTS.md` so it auto-loads inside the vault. But the vast majority of `/devlog` invocations happen in sessions rooted in **other projects**, where that file never loads at all — creating it would be decoration.
- **`~/.claude/rules/` with `paths` frontmatter was not used.** Only 5 of the 8 lessons can be scoped by path (chezmoi / hooks / shell / React / CSS); the other 3 (`git add` pathspec, grep anchors, MCP config location) trigger on **topic** rather than path, and path-scoping does not fit them. Introducing a symlink-plus-frontmatter mechanism to save a few hundred tokens does not pay.

## Lessons and tricks

- ==Before moving structure, grep for a second copy of whatever you are moving; anything that exists in exactly one place disappears silently when relocated.== Three of the four deletions here were made only after confirming a verbatim copy existed in the harness or a skill. The Agents/ workflow was the sole copy — and the only difference was one extra `Read` before touching anything. Distilled into [[trimming-config-files-needs-a-sole-copy-check]].
- **Check what an official number is a number about.** "Delete 80%" and "under 200 lines" describe two different subjects (Claude Code's own system prompt vs a user's CLAUDE.md); applying one to the other produces bad deletion decisions. Read docs together with their publication date and their intended subject.
- **Deduplication buys more than tokens.** The official claim is that redundant and conflicting instructions reduce adherence, so three synonymous versions of "don't dispatch subagents carelessly" do not make the model more obedient — they dilute the signal.

## Related
- [[2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[trimming-config-files-needs-a-sole-copy-check]]
- [[2026-07-07-unifying-dual-account-claude-config]]
- [[yagni-and-designing-for-present-requirements]]
- [[drawing-module-boundaries]]
