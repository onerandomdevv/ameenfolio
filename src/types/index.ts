export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  technologies: string[];
  link?: string;
  githubUrl?: string;
}

export interface Skill {
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  icon?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}
