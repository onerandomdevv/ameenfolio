import { SanityProject, SanitySlug, SanityImage, SanityTechnologies } from './sanity';

// Re-export Sanity types for convenience
export type { SanityProject, SanitySlug, SanityImage, SanityTechnologies };

// Legacy Project type - kept for backward compatibility
// Consider migrating to SanityProject directly
export interface Project {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description: string;
  category: ("projects" | "building" | "collabs" | "marketplace")[];
  teamSize?: number;
  roles?: string[];
  mainImage: any | string;
  gallery?: any[] | string[];
  technologies: {
    languages: { name: string; image?: string }[];
    frontend: { name: string; image?: string }[];
    backend: { name: string; image?: string }[];
    database: { name: string; image?: string }[];
    tools: { name: string; image?: string }[];
  };
  liveUrl?: string;
  githubUrl?: string;
  verified: boolean;
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
