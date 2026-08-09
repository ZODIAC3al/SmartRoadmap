import { API_BASE, apiFetch, apiJson } from './api';

/** Thin client for the Profile Import feature (GitHub / LinkedIn / Certificates). */

export interface GitHubRepo {
  id: number;
  name: string;
  description?: string | null;
  html_url?: string;
  homepage?: string | null;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
  languages?: Record<string, number>;
  readmeSnippet?: string;
}

export interface GitHubAccount {
  githubId: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
  followers?: number;
  following?: number;
  languagesSummary?: Record<string, number>;
  totalStars?: number;
  lastSyncedAt?: string;
  connectedAt?: string;
}

export interface LinkedInAccount {
  linkedinId: string;
  fullName?: string;
  email?: string;
  picture?: string;
  importMethod?: 'oauth' | 'manual' | 'pdf';
  profile?: {
    fullName?: string;
    headline?: string;
    about?: string;
    experience?: Array<{ title?: string; company?: string; startDate?: string; endDate?: string; description?: string }>;
    education?: Array<{ school?: string; degree?: string; fieldOfStudy?: string; startDate?: string; endDate?: string }>;
    skills?: string[];
    certifications?: Array<{ name?: string; authority?: string; issueDate?: string; expirationDate?: string; credentialId?: string; credentialUrl?: string }>;
    languages?: string[];
  };
  connectedAt?: string;
}

export interface Certificate {
  _id: string;
  title: string;
  organization?: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
}

export interface Project {
  _id: string;
  source: 'github' | 'manual' | 'linkedin';
  githubRepoId?: number;
  githubUrl?: string;
  name: string;
  description?: string;
  demoLink?: string;
  technologies: string[];
  readmeSnippet?: string;
  languages?: Record<string, number>;
  stars?: number;
  forks?: number;
  lastUpdated?: string;
  importedAt?: string;
}

// ── GitHub ──────────────────────────────────────────────────────────────
export const getGitHubStatus = () => apiJson<{ configured: boolean }>('/profile/github/status');
export const getGitHubAuthUrl = () => apiJson<{ configured: boolean; url: string | null }>('/profile/github/auth-url');
export const getGitHubAccount = () => apiJson<{ connected: boolean; account: GitHubAccount | null }>('/profile/github/account');
export const getGitHubRepos = () => apiJson<{ repos: GitHubRepo[] }>('/profile/github/repos');
export const refreshGitHub = () => apiJson<{ success: boolean; account: GitHubAccount }>('/profile/github/refresh', { method: 'POST' });
export const importGitHubRepos = (repos: unknown[]) =>
  apiJson<{ imported: Project[]; skipped: number }>('/profile/github/import', {
    method: 'POST',
    body: JSON.stringify({ repos }),
  });
export const disconnectGitHub = () =>
  apiJson<{ success: boolean }>('/profile/github/disconnect', { method: 'DELETE' });

// ── LinkedIn ────────────────────────────────────────────────────────────
export const getLinkedInStatus = () =>
  apiJson<{ configured: boolean; apiLimitations: boolean }>('/auth/linkedin/status');
export const getLinkedInAuthUrl = () =>
  apiJson<{ configured: boolean; url: string | null }>('/auth/linkedin');
export const getLinkedInAccount = () => apiJson<{ connected: boolean; account: LinkedInAccount | null }>('/profile/linkedin/account');
export const importLinkedInManual = (payload: unknown) =>
  apiJson<LinkedInAccount>('/profile/linkedin/import', { method: 'POST', body: JSON.stringify(payload) });
export const importLinkedInPdf = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiJson<LinkedInAccount>('/profile/linkedin/import-pdf', { method: 'POST', body: fd });
};
export const disconnectLinkedIn = () =>
  apiJson<{ success: boolean }>('/auth/linkedin', { method: 'DELETE' });

// ── Certificates ────────────────────────────────────────────────────────
export const uploadCertificate = (formData: FormData) =>
  apiJson<Certificate>('/profile/certificates', { method: 'POST', body: formData });
export const getCertificates = () => apiJson<{ certificates: Certificate[] }>('/profile/certificates');
export const updateCertificate = (id: string, dto: unknown) =>
  apiJson<Certificate>(`/profile/certificates/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const deleteCertificate = (id: string) =>
  apiJson<{ success: boolean }>(`/profile/certificates/${id}`, { method: 'DELETE' });

/** Fetches the certificate file as a blob (auth-safe, follows the redirect). */
export async function fetchCertificateBlob(id: string): Promise<Blob> {
  const res = await apiFetch(`/profile/certificates/${id}/file`);
  if (!res.ok) throw new Error('Could not load certificate file.');
  return res.blob();
}

// ── Projects (imported GitHub / LinkedIn / manual) ──────────────────────
export const getProjects = () => apiJson<{ projects: Project[] }>('/profile/projects');
export const updateProject = (id: string, dto: unknown) =>
  apiJson<Project>(`/profile/projects/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const deleteProject = (id: string) =>
  apiJson<{ success: boolean }>(`/profile/projects/${id}`, { method: 'DELETE' });

export const certificateFileUrl = (id: string, download = false) =>
  `${API_BASE}/profile/certificates/${id}/file${download ? '?download=1' : ''}`;
