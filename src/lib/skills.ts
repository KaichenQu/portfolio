export const skillCategories = [
  {
    label: "Java Stack",
    skills: [
      {
        name: "Java",
        description: "Spring Boot · Spring Cloud · Netty · MyBatis · JUnit",
        progress: 90,
      },
      {
        name: "Spring Ecosystem",
        description:
          "Spring Security · Spring Gateway · Spring Data JPA · OpenFeign · Actuator",
        progress: 85,
      },
      {
        name: "Database & Cache",
        description: "MySQL · Redis · MongoDB · ShardingSphere · ElasticSearch",
        progress: 82,
      },
    ],
  },
  {
    label: "TypeScript Stack",
    skills: [
      {
        name: "TypeScript",
        description:
          "Strict mode · Generics · Decorators · Zod · type-safe APIs",
        progress: 90,
      },
      {
        name: "React & Next.js",
        description:
          "React 19 · Next.js 15 · App Router · Server Components · TailwindCSS",
        progress: 85,
      },
      {
        name: "Node.js & Backend",
        description: "Nest.js · Express.js · REST · WebSocket · JWT · OAuth",
        progress: 78,
      },
    ],
  },
  {
    label: "Go & Systems",
    skills: [
      {
        name: "Go",
        description: "WebSocket · Goroutines · gRPC/Protobuf · Bitcask engine",
        progress: 75,
      },
      {
        name: "Distributed Systems",
        description:
          "Kafka · RocketMQ · Zookeeper · consistent hashing · Sentinel · at-least-once delivery",
        progress: 80,
      },
      {
        name: "Python",
        description:
          "Django · FastAPI · PyTorch · TensorFlow · OpenAI LLM · PyQt",
        progress: 75,
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
    src: "/skills-icons/zookeeper.png",
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
] as const;
