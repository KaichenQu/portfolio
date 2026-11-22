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

Case-note cover illustrations live at `public/blog/covers/<slug>.webp`, where `<slug>` is the note’s file stem processed by `slugify()` in `src/lib/devlog.ts`.

- Read the note and illustrate one concrete metaphor for its mechanism. Use generic nouns and blank surfaces. Keep text, letters, numbers, logos, brand marks, interface screenshots and faces out of the image.
- Use a white or near-white ground (`#FFFFFF` to `#FAFAF7`). Leave a continuous clear margin of at least 6% on all four sides of the final WebP. That is 72 px on the left and right and 48 px on the top and bottom. Keep shadows inside the margin and omit frames and vignettes.
- Export a 1200 × 800 px WebP of at most 150,000 bytes. Start at Sharp quality 80 and check the finished image at 400 px and 96 px wide. Leave room for the card’s 4% hover zoom.
- Use one of the six prompt blocks below, followed by the scene. Vary the composition within each direction. Keep neighboring covers in different directions by avoiding repeats within three positions of the newest-first index order.

| Direction | Reusable prompt block |
|---------|-----------------------|
| Exploded instrument | Technical pen-and-gouache instrument plate on white. Use charcoal contour, graphite shading, oxidized teal and one vermilion diagnostic detail. Choose an exploded, sectional or offset view of one instrument. Separate parts on a mechanically meaningful axis. Give the silhouette and the detail that changes the outcome more weight than the fine linework. |
| Cut-paper collage | Hand-cut matte cardstock on white, photographed from overhead. Use ultramarine, salmon, dark plum and white, with visible cut edges, paper fibers and tight cast shadows. Compose one layered silhouette around an overlap, void or interruption that explains the scene. |
| Two-ink risograph | Two-ink risograph printed in dense violet and tangerine on white. Use coarse halftones, limited overprint and slight registration drift within the shapes. Build the composition around one clear silhouette or repeated shape, with large deliberate white counterspaces. |
| Ink and wash | Editorial pen drawing with elastic black contours, broken dry-brush edges and concentrated indigo and ochre watercolor. Use one decisive line or gesture in a sparse composition. Keep washes inside the objects and keep the surrounding paper white. |
| Geometric poster | A collectible modernist screen-printed poster. Use at most carbon-black, saffron and electric cyan as the three spot inks on white. Align a few large modular shapes, countershapes and parallel edges to a hidden construction grid. Use a planned overlap, slight offset or dramatic change in scale where the main action occurs. The silhouette and the rhythm should carry the subject. Pure flat ink, with fine print grain only inside inked areas. No gradients, pictogram panels, drop shadows, outlines, or visible grid. |
| Stop-motion clay | Photograph hand-sculpted plasticine props in raspberry, mint and warm apricot on a white seamless. Keep the material matte, with thumb-pressed planes, tight contact shadows and readable silhouettes. Group props so that a physical action or tension is visible even without the surface texture. |

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
