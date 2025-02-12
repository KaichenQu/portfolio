export const skills = [
  {
    name: "React",
    description:
      "Proficient in React ecosystem, including Next.js, Redux, Tailwind CSS",
    progress: 85,
  },
  {
    name: "Java",
    description:
      "Expert in Java, with experience in Spring Boot, Spring Cloud, MyBatis",
    progress: 90,
  },
  {
    name: "Python",
    description:
      "Experienced in Django, Flask, and data analysis/automation scripting",
    progress: 80,
  },
  {
    name: "Node.js",
    description: "Backend development with Node.js using Express and NestJS",
    progress: 75,
  },
  {
    name: "Databases",
    description: "Skilled in MySQL, PostgreSQL, MongoDB, and Redis",
    progress: 85,
  },
  {
    name: "DevOps",
    description:
      "Hands-on experience with Docker, Kubernetes, AWS, GCP, and CI/CD",
    progress: 75,
  },
  {
    name: "Distributed Systems",
    description:
      "Familiar with Kafka, RocketMQ, Zookeeper, and gRPC for high-concurrency systems",
    progress: 80,
  },
  {
    name: "Testing",
    description:
      "Proficient in Jest, Cypress, JUnit, and PyTest for unit and integration testing",
    progress: 70,
  },
] as const;

export type Skill = (typeof skills)[number];
