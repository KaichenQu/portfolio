import { links } from "./data";

export type SectionName = (typeof links)[number]["hash"];

export type ProjectInfo = {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  imageUrlDark?: string;
  link: string;
  githubUrl: string;
  demoUrl: string;
};

export type Link = {
  nameEng: string;
  hash: string;
};
