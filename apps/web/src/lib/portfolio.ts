import { apiFetch, apiJson } from './api';

export interface PortfolioProjectData {
  name: string;
  description?: string;
  technologies?: string[];
  githubUrl?: string;
  demoLink?: string;
  stars?: number;
  language?: string;
  featured?: boolean;
}

export interface PortfolioData {
  _id?: string;
  userId?: string;
  username: string;
  title: string;
  template: 'developer' | 'modern' | 'minimal';
  bio: string;
  about: string;
  isPublished: boolean;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  skills: string[];
  projects: PortfolioProjectData[];
  experience: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>;
  education: Array<{ school: string; degree: string; fieldOfStudy: string; graduateDate: string }>;
  customSections?: Array<{ id: string; title: string; items: string[] }>;
}

export const getMyPortfolio = () => apiJson<{ success: boolean; data: PortfolioData }>('/portfolio/me');

export const savePortfolio = (data: Partial<PortfolioData>) =>
  apiJson<{ success: boolean; data: PortfolioData }>('/portfolio/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const publishPortfolio = () =>
  apiJson<{ success: boolean; data: PortfolioData }>('/portfolio/publish', { method: 'POST' });

export const unpublishPortfolio = () =>
  apiJson<{ success: boolean; data: PortfolioData }>('/portfolio/unpublish', { method: 'POST' });

export const getPublicPortfolio = (username: string) =>
  apiJson<{ success: boolean; data: PortfolioData }>(`/portfolio/public/${username}`);
