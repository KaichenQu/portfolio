export const skillCategories = [
  {
    skills: [
      {
        name: "Java",
        description: "Expert in Java, Spring Boot, Spring Cloud, MyBatis",
        progress: 90,
      },
      {
        name: "Python",
        description: "Django, Flask, Data Analysis, Automation Scripts",
        progress: 80,
      },
      {
        name: "TypeScript",
        description: "Modern JavaScript, Type Safety, Node.js",
        progress: 80,
      },
    ],
  },
] as const;

export type SkillCategory = (typeof skillCategories)[number];

export const skillIcons = [
  {
    src: "/skills-icons/Java-Dark.svg",
    alt: "Java",
  },
  {
    src: "/skills-icons/Python-Dark.svg",
    alt: "Python",
  },
  {
    src: "/skills-icons/Golang.svg",
    alt: "Go",
  },
  {
    src: "/skills-icons/React-Dark.svg",
    alt: "React",
  },
  {
    src: "/skills-icons/TypeScript.svg",
    alt: "TypeScript",
  },
  {
    src: "/skills-icons/MySQL-Dark.svg",
    alt: "MySQL",
  },
  {
    src: "/skills-icons/Redis-Dark.svg",
    alt: "Redis",
  },
  {
    src: "/skills-icons/MongoDB.svg",
    alt: "MongoDB",
  },
  {
    src: "/skills-icons/PostgreSQL-Dark.svg",
    alt: "PostgreSQL",
  },
  {
    src: "/skills-icons/RabbitMQ-Dark.svg",
    alt: "RabbitMQ",
  },
  {
    src: "/skills-icons/RocketMQ.png",
    alt: "RocketMQ",
  },
  {
    src: "/skills-icons/Zookeeper.png",
    alt: "Zookeeper",
  },
  {
    src: "/skills-icons/Kubernetes.svg",
    alt: "Kubernetes",
  },
  {
    src: "/skills-icons/Docker.svg",
    alt: "Docker",
  },
  {
    src: "/skills-icons/AWS-Dark.svg",
    alt: "AWS",
  },
  {
    src: "/skills-icons/GCP-Dark.svg",
    alt: "GCP",
  },
  {
    src: "/skills-icons/Git.svg",
    alt: "Git",
  },
  {
    src: "/skills-icons/Jenkins-Dark.svg",
    alt: "Jenkins",
  },
] as const;
