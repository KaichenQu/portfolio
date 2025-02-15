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
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/image1.png",
    link: "https://www.google.com",
    githubUrl: "https://www.google.com",
    demoUrl: "https://www.google.com",
  },
  {
    title: "Career Fair Registration System",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/image2.png",
    link: "https://www.google.com",
    githubUrl: "https://www.google.com",
    demoUrl: "https://www.google.com",
  },
  {
    title: "Storage App",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/image3.png",
    link: "https://www.google.com",
    githubUrl: "https://www.google.com",
    demoUrl: "https://www.google.com",
  },
  {
    title: "Missio Theme",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tags: ["React", "Next.js", "MongoDB", "Tailwind", "NodeJS"],
    imageUrl: "/image4.png",
    link: "https://www.google.com",
    githubUrl: "https://www.google.com",
    demoUrl: "https://www.google.com",
  },
];

export const skillsData = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Git",
  "Tailwind",
  "Prisma",
  "MongoDB",
  "Redux Toolkit",
  "Express",
  "Framer Motion",
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

export const timelineYears = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
];

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
