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
    title: "LiteKV – Lightweight Key-Value Database",
    description:
      "LiteKV is a lightweight key-value database written in Go. It is designed to be simple and easy to use. It is a good choice for small projects and embedded systems.",
    tags: ["Go", "Goroutines", "Channels", "TCP", "Bitcask"],
    imageUrl: "/image3.png",
    link: "",
    githubUrl: "https://github.com/KaichenQu/LiteKV",
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
  (_, i) => (endYear - i).toString()
);

export const workExperience = [
  {
    company: "BMW Group",
    role: "R&D Department of New Technology",
    startDate: "2023",
  },
  {
    company: "CDP Group",
    role: "Development Department",
    startDate: "2021",
  },
];
