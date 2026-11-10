---
type: case-design
date: 2026-11-09
tags: [design, frontend, nextjs, seo, privacy, redaction, git, vercel]
status: solved
publish: true
---
# Publishing a private notebook with redaction at sync time

The portfolio site (Next.js 15, a public GitHub repo, deployed by Vercel from `main`) got a blog at `/blog` that publishes this vault. The vault is private, and many notes describe systems at work. ==Redaction runs once, in the script that copies notes from the vault into the repo, and every check in that script fails closed before the first write.== The browser never sees the original text.

The first public sync shipped 113 notes and 18 diagrams. Ten notes were held back, because for them the story itself is the sensitive part. The live check after deploy found a bug that three PRs, two reviews and 185 tests had passed over: `SITE_URL` pointed at `www.kelsonqu.com`, a host with no [[DNS]] record.

![Publish pipeline](../../Diagrams/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync.pipeline.svg)

## Background and constraints

- The repo is public. Anything committed there stays readable in history even after a later commit removes it.
- 123 notes existed at the start. 14 carried a `project:` marker for work systems, and their bodies named environments, environment variables and internal PR numbers.
- The owner's decisions, in order: deploy automatically; redact on publish and draw the masked text as a mosaic; publish later notes with one command; hold back the notes whose sensitivity is the narrative.
- The site is on Tailwind 3. The brief ruled out a Tailwind 4 migration and any Quartz, Fumadocs or Contentlayer dependency.

## Candidate options

### Blog layout

| Candidate | Stars on 2026-11-09 | Outcome |
| --- | --- | --- |
| Quartz 4 (`jackyzha0/quartz`, MIT) | 13,558 | picked as the layout model, implemented natively |
| fumadocs | 13,581 | needs Tailwind 4; the site is on Tailwind 3 |
| timlrx `tailwind-nextjs-starter-blog` | 10,555 | looked at, not picked |
| astro-paper | 5,197 | Astro, not Next.js |

Quartz is built for Obsidian content: double-bracket wikilinks, `==highlights==`, Mermaid, folders. It is its own static-site generator, so it cannot mount inside a Next.js app. The blog copies its layout instead: explorer on the left, article in the centre, table of contents and backlinks on the right, tag pages.

### Where redaction runs

- **CSS blur over real text in the browser.** The text stays in the public repo and in the built HTML. Rejected.
- **At sync time, in the copy script.** The repo and the build only ever hold masked text. Picked.

### Where the patterns live

- **In the public repo.** The pattern list is itself the list of sensitive terms. Rejected.
- **In the private vault**, `_meta/redactions.txt`, overridable with `DEVLOG_REDACTIONS`. A missing or empty file aborts the sync. Picked.

## Decision

The sync in `scripts/sync-devlog.mjs` is the only gate between private text and the public repo. It reads every note and diagram, redacts in memory, runs a backstop over the output, and writes nothing if any check fails. `npm run devlog:publish` is the only route from the mirror into the git index.

A match becomes a run of U+2592 (the medium-shade block). The run's length is the match length rounded up to a multiple of 4 and capped at 24, so the exact length of the hidden term does not leak (`scripts/sync-devlog.mjs:104-106`). The page wraps each run in a `span.redacted` and draws it as a mosaic (`src/components/blog/mosaic.tsx:7-18`).

## Second copies of the text

The same text also sits in other places in each file:

| Copy | Handling | Where |
| --- | --- | --- |
| frontmatter `project`, `links`, `source`, `triggers` | dropped from the mirror | `scripts/sync-devlog.mjs:35` |
| draw.io editable source in the root `content` attribute | stripped | `scripts/sync-devlog.mjs:318-331` |
| PNG label fallback inside each `<switch>` | stripped; text replacement cannot reach a bitmap | `scripts/sync-devlog.mjs:324-330` |
| any `data:` payload left in an SVG | the sync aborts | `scripts/sync-devlog.mjs:434-437` |
| a held-back note's stem in the output | the sync aborts | `scripts/sync-devlog.mjs:287-291` |

## Two kinds of sensitivity

**Term-level sensitivity** is a name, a host or an identifier. A pattern can mask it.

**Narrative sensitivity** is when the story is the secret: who the customer was, how the infrastructure is laid out. Masking every noun in such a note still leaves the story, so no pattern fixes it. Those notes get `publish: false`.

Ten notes were held back. An earlier message to the owner said nine; the missed one was a technique note, and the count was corrected in a later message. Holding them back also shrank the redaction work: the first full sync masked 397 matches in 18 notes and 8 diagrams, the sync after the hold-back masked 101 matches in 9 notes and 3 diagrams.

## Links to held-back notes

Published notes still linked to held-back ones: 26 wikilinks in 16 notes. An unresolved link renders its target's stem, and the topic maps put a one-line summary next to each link, so a link alone could describe a held-back note. The sync handles them before pattern masking (`scripts/sync-devlog.mjs:187-232`):

1. A list line whose links all point at held-back notes is dropped.
2. Any other link to a held-back note becomes a fixed run of 8 mask characters.
3. A section that had list items and lost all of them to step 1 is removed with its heading and intro sentence. A section that never had list items stays.
4. The backstop aborts if a held-back stem or slug remains anywhere in the output.

Step 3 came from looking at the mirror: after step 1, five map sections were a bare heading.

## Independent privacy review

An independent review of the redaction PR found no leak with the real vault. It found several paths that failed open:

| Finding | Fix | Test |
| --- | --- | --- |
| Masking ran pattern by pattern on the previous pattern's output. An earlier mask could remove the context a later lookbehind or an overlapping literal needed, and the backstop reran the same patterns on already-masked text, so it could not see the miss. | Collect the match ranges of every pattern on the original text, merge overlapping ranges, mask once (`scripts/sync-devlog.mjs:146-176`). | `scripts/sync-devlog.test.mjs:188`, `:198` |
| The backstop looked only at the raw output. | Test every pattern against several views of every output file and abort on any hit (`scripts/sync-devlog.mjs:244-293`). | `scripts/sync-devlog.test.mjs:499` |
| Pattern parsing accepted malformed lines. | A line starting with `/` must be exactly `/body/flags`; trailing whitespace throws; errors name the line number only (`scripts/sync-devlog.mjs:65-102`). | `scripts/sync-devlog.test.mjs:233` |
| `publish:` accepted any value. | Only `true` or `false`, any case, optionally quoted (`scripts/sync-devlog.mjs:48-58`). | `scripts/sync-devlog.test.mjs:277`, `:289` |
| A frontmatter block that did not parse was treated as body, so `publish: false` was ignored. | It throws (`scripts/sync-devlog.mjs:38-46`). | `scripts/sync-devlog.test.mjs:108` |

The backstop views:

| View | What it undoes |
| --- | --- |
| raw | nothing |
| tags joined, tags spaced | a term split by `<span>` or `<br/>` |
| entities | `&#160;` or a numeric entity inside a word |
| unicode spaces | non-breaking and other Unicode spaces |
| whitespace collapsed | a soft wrap |
| percent decoded | `%20` |
| emphasis removed | `**`, `_`, `~~`, `==` |
| all, tags joined / all, tags spaced | the steps chained, for a split that needs two of them |

The review round took the redaction PR from 148 to 181 tests (sync tests 24 to 52, publish tests 4 to 9). The section-removal fix added 4 more, for 185.

## Publish command

The two mirror paths stay gitignored (`.gitignore:44-46`). `npm run devlog:publish` force-adds them with `git add -f -A -- <two paths>`, so a stray `git add -A` anywhere cannot stage a mirror.

| Guard | Where |
| --- | --- |
| refuses unless on `main` | `scripts/publish-devlog.mjs:36-38` |
| refuses with anything staged outside the two paths, checked with `--no-renames` before and after `git add` | `scripts/publish-devlog.mjs:26-34`, `:39`, `:52` |
| refuses unless `origin/main..HEAD` is empty, so no earlier local commit rides along | `scripts/publish-devlog.mjs:40-44` |
| skips a path that exists neither on disk nor in the index, since `git add` fails on a pathspec that matches nothing | `scripts/publish-devlog.mjs:47-51` |
| after committing, asserts the diff against `origin/main` lies inside the two paths, else undoes the commit | `scripts/publish-devlog.mjs:57-68` |
| undoes the commit when the push is rejected, so the next run starts clean | `scripts/publish-devlog.mjs:69-76` |

## Unattended publishing

The same day the owner asked for publishing with no manual step. The notebook repository now runs `npm run devlog:publish` in GitHub Actions on every push to its `main`: it checks out the notebook and the site, sets `DEVLOG_DIR` to the notebook checkout, and pushes the mirror with a deploy key that can write to the site repository only.

With nobody reading a new note before it goes public, cases got their own gate. A note under `Cases/`, or one with `type: case-*`, is published only when its frontmatter says `publish: true`. A case without the line is held back like a `publish: false` note and counted in a `held for review` line (`holdReason` in `scripts/sync-devlog.mjs`). The gate keys on the folder as well as the type, so a missing or misspelt `type` cannot slip a case through. It does not key on `project:`, because 18 cases carry no `project:` field. Other note types publish unless they say `publish: false`.

The 24 cases that were already public got `publish: true`, and both case templates default to `publish: false`. The first run in CI printed `held for review: 0` and `devlog: nothing changed, nothing committed`.

## Module breakdown

| Unit | Responsibility |
| --- | --- |
| `loadPatterns` | parse the vault's patterns file; throw on anything ambiguous |
| `hideUnpublished` | drop or mask links to held-back notes; remove emptied sections |
| `maskText` | merged-range masking; for SVGs also on the entity-decoded view |
| `stripSvg` | remove comments, the root `content` attribute and PNG label fallbacks |
| `assertClean` | the backstop: every pattern and every held-back name over every view |
| `syncDevlog` | read and check everything, then write and prune the two targets, then print counts only |
| `publishDevlog` | the git guards above |

## Data flow

1. Read the patterns file; abort if it is missing, empty or malformed.
2. Read every note in the published folders. Notes with `publish: false` are recorded as held back and not copied.
3. For each published note: abort if a pattern matches its file name or slug, or if the source already contains U+2592; drop the private keys, hide held-back links, mask; run the backstop.
4. For each SVG a published note references: strip, mask, abort on a `data:` URI, run the backstop.
5. Only then write `content/devlog/` and `public/blog/diagrams/`, and prune files no longer published.
6. `devlog:publish` commits the two paths and pushes `main`; Vercel deploys.

## Result

```
notes: 113 copied, 10 skipped, 0 removed; diagrams: 18 copied, 0 removed
redacted: 101 matches in 9 notes and 3 diagrams (0 entity-encoded in SVGs)
held-back links: 21 list lines dropped, 5 links masked, 5 sections removed
```

| Check | Result |
| --- | --- |
| backstop views over the 131 mirror files | 0 hits in every view |
| `npm test` | 27 files, 185 tests |
| live `/sitemap.xml` | 201 URLs, 113 of them note pages |
| two held-back note URLs | 404 |
| held-back stems in the `/blog` HTML | 0 |

## The miss found by the live check

`SITE_URL` in `src/lib/seo.ts:3` was `https://www.kelsonqu.com`. The address entered the repo in 2025 and predates this work. `www` has no DNS record; the apex serves the site. Every canonical link, `og:url`, `og:image` and sitemap entry pointed at a host that does not resolve, so social cards could not load their image.

Three PRs, two reviews and 185 tests passed over it, because nothing resolved the host. The tests compared URLs against the constant. The session's first `dig`, before any code was written, had timed out inside the command sandbox and was never rerun:

```
$ dig +short blog.kelsonqu.com www.kelsonqu.com kelsonqu.com
;; connection timed out; no servers could be reached
```

Post-deploy verification found it:

```
$ for h in kelsonqu.com www.kelsonqu.com; do printf '%s: ' "$h"; dig +short "$h" | tr '\n' ' '; echo; done
kelsonqu.com: 172.67.161.130 104.21.65.89
www.kelsonqu.com:
$ curl -sS -o /dev/null -w '%{http_code} %{remote_ip}\n' https://www.kelsonqu.com/blog
curl: (6) Could not resolve host: www.kelsonqu.com
000
```

The fix pointed `SITE_URL`, `public/robots.txt`, the README link and `src/app/sitemap.test.ts` at the apex. After the deploy:

```
<link rel="canonical" href="https://kelsonqu.com"/>
og:image fetch: 200 image/png 24878
sitemap www entries: 0
```

## Open points

- **Open:** Shiki's regex engine (oniguruma wasm) fails under jsdom, so `src/lib/devlog.test.ts` is pinned to the node environment (`src/lib/devlog.test.ts:1`) and no component test can render a note. Switching Shiki to its JavaScript regex engine is the fix, when such a test is needed.
- **Open:** `www.kelsonqu.com` still has no DNS record. Anyone typing it gets nothing; a CNAME to the apex would fix that.

## Out of scope (YAGNI)

- No Quartz, Fumadocs or Contentlayer dependency, and no Tailwind 4 migration.
- No handling for `<text>` fallbacks inside `<switch>`: none exist in the vault's diagrams.
- No symlink handling in the two targets.
- Held-back notes are not rewritten into a publishable form; releasing one means removing its `publish: false` and running the publish command.

See [[yagni-and-designing-for-present-requirements]].

## Lessons and small tricks

- Redact where the text is copied, never where it is displayed. Anything the browser hides is still in the repo and the HTML.
- Keep the pattern list in the private source, not next to the code it protects.
- List every second copy of the text before calling a file redacted: frontmatter, embedded editor source, bitmap fallbacks, link targets.
- Mask all patterns over one set of ranges taken from the original text. A pattern applied to another pattern's output tests a different text than the author wrote it for.
- A backstop that reruns the masking patterns on the masked text checks nothing new. Give it other views of the output.
- Decide per note whether the sensitivity is a term or the story. Only the first is a redaction problem.
- A site URL constant is not evidence that the host resolves. See [[site-url-constant-is-not-proof-the-host-resolves]] and [[config-on-disk-is-not-config-in-effect]].
- Inside the command sandbox, `npm ci` needs a cache under `$TMPDIR`. See [[npm-ci-eperm-inside-the-command-sandbox]].

## Related

- [[site-url-constant-is-not-proof-the-host-resolves]]
- [[npm-ci-eperm-inside-the-command-sandbox]]
- [[git-add-multi-pathspec-fails-atomically]]
- [[config-on-disk-is-not-config-in-effect]]
- [[reproduce-before-fixing-verify-after]]
- [[yagni-and-designing-for-present-requirements]]
- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
- [[DNS]] · [[SEO]] · [[PR]]
