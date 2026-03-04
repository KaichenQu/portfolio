import { Education, Link, ProjectInfo } from "./types";

export const links: Link[] = [
  {
    nameEng: "Home",
    hash: "/",
  },
  {
    nameEng: "About",
    hash: "/about",
  },
  {
    nameEng: "Showcases",
    hash: "/showcase",
  },

  {
    nameEng: "Contact",
    hash: "/contact",
  },
  {
    nameEng: "Blog",
    hash: "/blog",
  },
];

export const projectsData: ProjectInfo[] = [
  {
    title: "Shortlink Platform",
    description:
      "Shortlink Platform is a full-stack web app enabling users to create shortlinks for their links. It is built with Java, Spring Boot, Spring Cloud, Redis, MySQL, RocketMQ, Apache ShardingSphere, Sentinel.",
    tags: ["Java", "Spring Boot", "Spring Cloud", "Redis", "MySQL", "RocketMQ"],
    imageUrl: "/image1.png",
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
    link: "https://career-deploy.vercel.app/",
    githubUrl: "https://github.com/KaichenQu/frontend/tree/2f1a2de2330635f3699b97b68697d93846e16480",
    demoUrl: "https://career-deploy.vercel.app/",
  },
  {
    title: "Distributed Real-Time Messaging Platform",
    description:
      "Built distributed IM backend in Go with WebSocket connections and Kafka message relay, supporting 1:1 chat, group messaging, and file transfer with 5K+ concurrent connections per 2vCPU node and at-least-once delivery. Designed inter-service layer via gRPC/Protobuf for user, group, and message microservices, enabling horizontal scaling across 4 nodes with consistent hashing and Nginx load balancing. Implemented MySQL write-ahead persistence and Redis hot-path caching at 15ms p95 retrieval; deployed with Docker Compose and Prometheus/Grafana observability stack.",
    tags: ["Go", "WebSocket", "Kafka", "gRPC", "Redis", "MySQL"],
    imageUrl: "/image3.png",
    link: "",
    githubUrl: "",
    demoUrl: "",
  },
  {
    title: "Kanbas React Web App",
    description:
      "Kanbas is a Canvas like website for creating and managing courses, includes functions like chat, file storage, and quizzes.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/kanbas.png",
    link: "https://kanbas-react-web-app-kaichen.netlify.app",
    githubUrl: "https://github.com/KaichenQu/kanbas-react-web-app",
    demoUrl: "https://kanbas-react-web-app-kaichen.netlify.app",
  },
];



export const educationData: Education[] = [
  {
    school: "Northeastern University",
    degree: "Master of Science in Computer Science",
    startYear: "2023",
    endYear: "2026",
  },
  {
    school: "East China University of Science and Technology",
    degree: "Bachelor of Engineering in Energy and Power Engineering",
    startYear: "2019",
    endYear: "2023",
  },
];

// Generate timeline years from 2019 to current year + 1
const startYear = 2019;
const endYear = new Date().getFullYear() + 1;
export const timelineYears = Array.from(
  { length: endYear - startYear + 1 },
  (_, i) => (startYear + i).toString()
);

export const workExperience = [
  {
    company: "Evenness Inc.",
    role: "Backend Engineer Intern",
    location: "Cupertino, CA",
    period: "Jul 2025 – Dec 2025",
    startDate: "2025",
  },
  {
    company: "BMW Group",
    role: "R&D Engineer Intern",
    location: "Shanghai, China",
    period: "Jul 2022 – May 2023",
    startDate: "2023",
  },
  {
    company: "CDP Group",
    role: "R&D Engineer Intern",
    location: "Shanghai, China",
    period: "Jul 2021 – Oct 2021",
    startDate: "2021",
  },
];
