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

`/blog` is built at compile time from Markdown notes in `content/devlog/` and SVG diagrams in `public/blog/diagrams/`, both mirrored from an Obsidian vault (`DEVLOG_DIR`, default `~/Obsidian/DevLog`). With them empty the page shows `No notes yet.`

| Command | What it does |
|---------|--------------|
| `npm run devlog:sync` | Mirrors the vault into the two folders, redacted. Notes with `publish: false` (`true` or `false` only) are held back: a list item that only links held-back notes is dropped, any other link to one is masked. Only SVGs a published note references are copied. |
| `npm run devlog:publish` | On `main`, level with `origin/main` and with nothing else staged: runs the sync, force-adds the two folders (both are gitignored, so nothing else stages them), commits `docs(devlog): sync notes` and pushes `origin main`, which Vercel deploys. A rejected push undoes the commit. |

Redaction patterns live in the vault, never in this repo: `DEVLOG_REDACTIONS`, default `<DEVLOG_DIR>/_meta/redactions.txt`. One entry per line, exactly `/regex/flags` (flags from `dgimsuv`) or a case-sensitive literal; blank lines and `#` lines are ignored, trailing whitespace is an error. Every match becomes a run of `▒` (length rounded up to a multiple of 4, at most 24), drawn on the page as a tile mosaic. The sync aborts before writing when the file is missing or empty, a pattern matches a file name, a source already contains `▒`, an SVG keeps a `data:` URI, or a pattern or a held-back note's name still shows in any check view of an output file (tags stripped, entities, percent-encoding, spaces and emphasis normalised). It drops the `project`, `links`, `source` and `triggers` frontmatter keys and draw.io's embedded source and PNG label copies.

The reading layout (explorer, table of contents, backlinks, tag pages) follows [Quartz 4](https://github.com/jackyzha0/quartz) by jackyzha0, MIT License. No Quartz code is included.

## Contact

- GitHub: [KaichenQu](https://github.com/KaichenQu)
- LinkedIn: [kelsonqu](https://www.linkedin.com/in/kelsonqu/)
- Email: kelsonqu@gmail.com
- Blog: [kelsonqu.com/blog](https://www.kelsonqu.com/blog)
