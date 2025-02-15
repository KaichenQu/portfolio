import { links } from "./data";

export type SectionName = (typeof links)[number]["hash"];

export type ProjectInfo = {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  link: string;
  githubUrl: string;
  demoUrl: string;
};

export type Link = {
  nameEng: string;
  hash: string;
};

type About = {
  title: string;
  im: string;
  job: string;
  description: string;
  stacks: string;
  otherStacks: string;
  otherPassion: string;
  conclusion: string;
};
export type Texts = {
  about: About;
};

export type Education = {
  startYear: string;
  endYear: string;
  school: string;
  degree?: string;
};
