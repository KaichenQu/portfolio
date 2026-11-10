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

`/blog` is built at compile time from Markdown notes in `content/devlog/` and SVG diagrams in `public/blog/diagrams/`. Both are filled by `npm run devlog:sync`, which mirrors an Obsidian vault (`DEVLOG_DIR`, default `~/Obsidian/DevLog`) and skips notes marked `publish: false`. Both folders are gitignored; with them empty the page shows `No notes yet.`

The reading layout (explorer, table of contents, backlinks, tag pages) follows [Quartz 4](https://github.com/jackyzha0/quartz) by jackyzha0, MIT License. No Quartz code is included.

## Contact

- GitHub: [KaichenQu](https://github.com/KaichenQu)
- LinkedIn: [kelsonqu](https://www.linkedin.com/in/kelsonqu/)
- Email: kelsonqu@gmail.com
- Blog: [kelsonqu.com/blog](https://www.kelsonqu.com/blog)
