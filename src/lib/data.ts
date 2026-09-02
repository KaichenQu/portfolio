import { Link, ProjectInfo } from "./types";

export const links: Link[] = [
  {
    nameEng: "Home",
    hash: "/",
  },
  {
    nameEng: "About",
    hash: "/#about",
  },
  {
    nameEng: "Projects",
    hash: "/#projects",
  },
  {
    nameEng: "Contact",
    hash: "/#contact",
  },
  {
    nameEng: "Blog",
    hash: "https://blog.kelsonqu.com",
  },
];

export const projectsData: ProjectInfo[] = [
  {
    title: "Physics Agent Platform",
    description:
      "Multi-tenant Kubernetes platform for EV cell design, built on FastAPI, Pydantic AI, Temporal, Postgres HA and vLLM. Per-flow writer leases with fencing tokens run 5 design branches in parallel with zero lost writes. A liquid-rocket agent wraps RocketCEA, RPA and PicoGK as Pydantic tools, gated by rule checks and human sign-off, cutting time-to-closed-loop from 3–5 months to 3–6 weeks.",
    tags: [
      "FastAPI",
      "Pydantic AI",
      "Temporal",
      "Kubernetes",
      "Postgres",
      "vLLM",
    ],
    imageUrl: "/projects/physics-light.png",
    imageUrlDark: "/projects/physics-dark.png",
    link: "",
    githubUrl: "",
    demoUrl: "",
  },
  {
    title: "Agentic Equity Investment Research System",
    description:
      "Supervisor agent scheduling 4 sub-agents from ticker to trade call, with writes gated on human approval. Retries, timeouts and schema-checked hand-offs contain single-tool failures without aborting the run. A trajectory eval harness scores tool-call correctness and blocks any merge below 90%.",
    tags: ["Python", "Claude Agent SDK", "MCP", "LangGraph", "Langfuse"],
    imageUrl: "/projects/equity-light.png",
    imageUrlDark: "/projects/equity-dark.png",
    link: "",
    githubUrl: "",
    demoUrl: "",
  },
  {
    title: "High-Throughput URL Shortening Service",
    description:
      "Java + Spring Boot shortlink service benchmarked with wrk at 10K TPS writes and 50K QPS reads at 50 ms p95. Sharded across 4 MySQL nodes with ShardingSphere for 3x write throughput over an unsharded baseline. Async RocketMQ writes with multi-level Redis caching and Bloom filters cut peak DB load 70% at 80 ms p99.",
    tags: ["Java", "Spring Boot", "ShardingSphere", "RocketMQ", "Redis"],
    imageUrl: "/projects/shortlink-light.png",
    imageUrlDark: "/projects/shortlink-dark.png",
    link: "",
    githubUrl: "https://github.com/KaichenQu/shortlink",
    demoUrl: "",
  },
  {
    title: "Career Fair Registration System",
    description:
      "The Career Fair Registration System is a full-stack web app enabling students to register, apply for jobs, and track applications. Companies can post openings and review applicants. Admins manage users and announcements. Built with Django and Next.js, it integrates OpenAI LLM for automated, intelligent user support.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/careerfair.png",
    link: "",
    githubUrl:
      "https://github.com/KaichenQu/frontend/tree/2f1a2de2330635f3699b97b68697d93846e16480",
    demoUrl: "",
  },
  {
    title: "Kanbas React Web App",
    description:
      "Kanbas is a Canvas like website for creating and managing courses, includes functions like chat, file storage, and quizzes.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/kanbas.jpg",
    link: "https://kanbas-react-web-app-kaichen.netlify.app",
    githubUrl: "https://github.com/KaichenQu/kanbas-react-web-app",
    demoUrl: "https://kanbas-react-web-app-kaichen.netlify.app",
  },
];
