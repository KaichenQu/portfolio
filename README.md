# kelsonqu.com — Personal Portfolio

Personal portfolio of **Kelson Qu**, M.S. CS @ Northeastern University. Built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- Two-column sticky sidebar layout with in-page scroll navigation
- Dark / light mode with cursor glow effect
- Resume inline preview (PDF viewer with zoom controls)
- Animated sections: About, Projects, Experience, Education, Skills, Contact
- Real-time clock (Bay Area & visitor local time)
- Scroll progress bar

## Tech Stack

| Layer | Libraries |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide, React Icons |
| Email | Resend (contact form) |

## Projects Featured

- **Physics Agent Platform** — FastAPI, Pydantic AI, Temporal, Kubernetes, Postgres, vLLM
- **Agentic Equity Investment Research System** — Python, Claude Agent SDK, MCP, LangGraph, Langfuse
- **High-Throughput URL Shortening Service** — Java, Spring Boot, ShardingSphere, RocketMQ, Redis (10K TPS writes / 50K QPS reads)
- **Career Fair Registration System** — Next.js, Django, MongoDB, OpenAI LLM integration
- **Kanbas React Web App** — Canvas-like LMS with quizzes and file storage

## Local Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## DevLog

`/blog` is built at compile time from Markdown notes in `content/devlog/` and SVG diagrams in `public/blog/diagrams/`, both mirrored from an Obsidian vault (`DEVLOG_DIR`, default `~/Obsidian/DevLog`). The Simplified Chinese edition at `/blog/zh` uses the same relative note paths under `zh/` in the vault, with localized figures in `zh/Diagrams/`. Sync writes them to `content/devlog/zh/` and `public/blog/diagrams/zh/`.

The index has one newest-first, two-lane case log. The topic links show case counts and filter the log using the `topic` query parameter. A selected topic links to its page and shows counts of other linked notes. With JavaScript disabled, the topic links open those pages directly. The sidebar explorer lists the whole notebook.

### Case covers

The English cover lives at `public/blog/covers/<slug>.webp` and the Chinese cover at `public/blog/covers/zh/<slug>.webp`. Both are 1200 × 800 WebP files capped at 150,000 bytes. A missing edition cover falls back to the first synced diagram for that edition.

1. Read the published note in `content/devlog/` and its translation in `content/devlog/zh/`. Write each two-line hook in its own language. Use roughly 2–6 English words or 4–12 Chinese characters. Use names only when the note publishes them, and preserve their spelling. Pick an expression that matches the hook.
2. Use `scripts/blog-covers/duck.webp` as the identity sheet for every scene. Keep the two-point tuft, lemon body, coral bill, oversized brows and dark rim. Choose one or two literal props. Alternate among a wide group below the headline, duck on the left, duck on the right and an oversized prop. Rotate the five grounds in the newest-first list so each layout and ground is separated from its next use by at least three covers.
3. Save the text-free artwork with alpha to `scripts/blog-covers/illustrations/<slug>.webp`, around 100,000 bytes or less. Add the slug, scene, emotion, layout, ground and English and Chinese line arrays to `scripts/blog-covers/manifest.json`.

```text
Draw one flat-cartoon vignette on a genuinely transparent background. Use the supplied expression sheet as the identity reference for a single original debugging duck. Keep its round lemon-yellow body, swept two-point tuft, short coral bill, large expressive eyes and brows, coral webbed feet and three-lobed wings. Use thick dark outlines and flat solid fills. Show one or two literal objects with simple, blank surfaces and one small comic effect where useful. Keep the whole group inside a small transparent gutter. Omit lettering, numbers, punctuation, logos, textures, shadows, and fake writing. Use pale equipment shells on the night-indigo ground.
```

Append the arrangement and its scene to the prompt using generic nouns. Code sets the headline in Resource Han Rounded CN Heavy. The first line sits on the ground and the second line reverses on a solid panel. The compositor fits each edition separately and gives the longer line a wider slot in side layouts. Aim for roughly 70–85% of the width on that line where the scene allows it. Preview each finished cover at 180 px wide and at full size.

The grounds rotate through mint `#53E3B4`, guava `#FF7894`, ultramarine `#484ADC`, sky `#69D9F7` and night indigo `#1A1740`. Night indigo pairs yellow type with a cyan panel.

With `uv` and 7-Zip installed, rebuild both editions of one cover from the repository root.

```sh
uv run scripts/blog-covers/compose.py --slug 2026-11-05-requests-hang-then-fail-in-500-batches
```

Omit `--slug` to rebuild the manifest, or pass `--locale en` or `--locale zh` for one edition. On first use the compositor fetches the pinned upstream archive, checks its SHA-256 and the extracted font's SHA-256, and caches the font in `scripts/blog-covers/.font-cache/`. The font license is at `scripts/blog-covers/font/OFL.txt`. [Pinned Resource Han Rounded release](https://github.com/CyanoHao/Resource-Han-Rounded/releases/tag/v0.990)

### Notebook sync

| Command | What it does |
|---------|--------------|
| `npm run devlog:sync` | Mirrors the vault into the two folders, redacted. Notes with `publish: false` (`true` or `false` only) are held back: a list item that only links held-back notes is dropped, any other link to one is masked. A case (a note under `Cases/`, or one with `type: case-*`) is published only with an explicit `publish: true`; a case with no `publish:` line is held back the same way and counted in the `held for review: N` summary line. Only SVGs a published note references are copied. |
| `npm run devlog:publish` | On `main`, level with `origin/main` and with nothing else staged: runs the sync, force-adds the two folders (both are gitignored, so nothing else stages them), commits `docs(devlog): sync notes` and pushes `origin main`, which Vercel deploys. A rejected push undoes the commit. |

Redaction patterns live in the vault, never in this repo: `DEVLOG_REDACTIONS`, default `<DEVLOG_DIR>/_meta/redactions.txt`. One entry per line, exactly `/regex/flags` (flags from `dgimsuv`) or a case-sensitive literal; blank lines and `#` lines are ignored, trailing whitespace is an error. Every match becomes a run of `▒` (length rounded up to a multiple of 4, at most 24), drawn on the page as a tile mosaic. The sync aborts before writing when the file is missing or empty, a note, SVG or folder in either edition is a symbolic link, a pattern matches a file name, a source already contains `▒`, an SVG keeps a `data:` URI, or a pattern or a held-back note's name still shows in any check view of an output file (tags stripped, entities, percent-encoding, spaces and emphasis normalised). It drops the `project`, `links`, `source` and `triggers` frontmatter keys and draw.io's embedded source and PNG label copies.

A Chinese note follows the publication decision of its English twin at the same relative path. A missing or unpublished twin, or the translation's own `publish: false`, keeps the Chinese note out. If the English note or any SVG it references has a redaction match, the translation needs its own explicit `publish: true`. A translated spelling can evade a pattern even when the original spelling is also present. Translations awaiting approval are listed by relative path under `Chinese held for review: N`. For each redaction pattern, the translation and each corresponding referenced SVG must retain at least as many matches as the English note or SVG. If an English figure with matches has no translated counterpart, the translation stays out. Counts use note text after private keys and held links are removed, and SVGs after embedded draw.io source and PNG label fallbacks are stripped. The summary lists parity holds by relative path. If there are already Chinese notes or diagrams in the mirror, a source with no Chinese notes aborts before any writes. The existing English summary lines and redaction checks apply alongside the Chinese output.

Publishing runs unattended: the notebook repository runs `DEVLOG_DIR=<notebook checkout> npm run devlog:publish` on every push to its `main`, so nobody reads a new note before it goes public. That is why a case waits for its own `publish: true`: masking hides terms, but a case's story can be the sensitive part.

The reading layout (explorer, table of contents, backlinks, tag pages) follows [Quartz 4](https://github.com/jackyzha0/quartz) by jackyzha0, MIT License. No Quartz code is included.

## Contact

- GitHub: [KaichenQu](https://github.com/KaichenQu)
- LinkedIn: [kelsonqu](https://www.linkedin.com/in/kelsonqu/)
- Email: kelsonqu@gmail.com
- Blog: [kelsonqu.com/blog](https://kelsonqu.com/blog)
