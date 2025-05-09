export const skillCategories = [
  {
    skills: [
      {
        name: "C++",
        description: "STL, Smart Pointers, Templates, Modern C++, Memory Management",
        progress: 50,
      },
      {
        name: "Java",
        description:
          "Spring Boot, Spring Cloud, MyBatis, Hibernate, Netty, JUnit",
        progress: 90,
      },
      {
        name: "Python",
        description:
          "Django, PyTorch, TensorFlow, Automation Scripts, Data Processing",
        progress: 85,
      },
      {
        name: "Go",
        description: "Goroutines, Channels, Bitcask, TCP, Concurrency",
        progress: 60,
      },
      {
        name: "TypeScript",
        description: "Modern ES6+, Node.js, Nest.js, Express.js",
        progress: 90,
      },
      {
        name: "Database",
        description: "MySQL, MongoDB, Redis, Apache ShardingSphere",
        progress: 80,
      },
      {
        name: "Distributed Systems",
        description:
          "Zookeeper, Kafka, RocketMQ, gRPC, Circuit Breaker, Load Balancing",
        progress: 80,
      },
      {
        name: "DevOps & Cloud",
        description: "Docker, Kubernetes, Jenkins, AWS (EC2, S3, ELB), GCP",
        progress: 20,
      },
    ],
  },
] as const;

export type SkillCategory = (typeof skillCategories)[number];

export const skillIcons = [
  {
    src: "/skills-icons/CPP.svg",
    alt: "C++",
  },
  {
    src: "/skills-icons/C.svg",
    alt: "C",
  },
  {
    src: "/skills-icons/Java-Dark.svg",
    alt: "Java",
  },
  {
    src: "/skills-icons/Python-Dark.svg",
    alt: "Python",
  },
  {
    src: "/skills-icons/GoLang.svg",
    alt: "Go",
  },

  {
    src: "/skills-icons/TypeScript.svg",
    alt: "TypeScript",
  },
  {
    src: "/skills-icons/React-Dark.svg",
    alt: "React",
  },
  {
    src: "/skills-icons/nextjs.jpeg",
    alt: "Next.js",
  },
  {
    src: "/skills-icons/Spring-Dark.svg",
    alt: "Spring",
  },
  {
    src: "/skills-icons/FastAPI.svg",
    alt: "FastAPI",
  },
  {
    src: "/skills-icons/NodeJS-Dark.svg",
    alt: "Node.js",
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
    src: "/skills-icons/rocketmq.png",
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
    src: "/skills-icons/Elasticsearch-Dark.svg",
    alt: "Elasticsearch",
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
  {
    src: "/skills-icons/linux.jpeg",
    alt: "Linux",
  },
  {
    src: "/skills-icons/prometheus.png",
    alt: "Prometheus",
  },

  {
    src: "/skills-icons/Kotlin-Dark.svg",
    alt: "Kotlin",
  },
  {
    src: "/skills-icons/Git.svg",
    alt: "Git",
  },
] as const;
