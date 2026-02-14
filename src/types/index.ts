export interface Project {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description: string;
  category: "projects" | "building" | "collabs" | "marketplace";
  mainImage: any;
  gallery?: any[];
  technologies: {
    languages: string[];
    frontend: string[];
    backend: string[];
    database: string[];
    tools: string[];
  };
  liveUrl?: string;
  githubUrl?: string;
  verified: boolean;
  cta?: {
    telegram?: string;
    whatsapp?: string;
    email?: string;
  };
  content?: any[];
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
