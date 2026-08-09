import { apiFetch } from './api';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
export type WorkType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';

export type ScoredJob = {
  _id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  requiredSkills: string[];
  technologies?: string[];
  salaryMin?: number;
  salaryMax?: number;
  remote: boolean;
  workType?: WorkType;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  description: string;
  matchScore: number;
  matchingSkills?: string[];
  skillsGap: string[];
  externalUrl?: string;
  postedAt?: string;
  createdAt?: string;
};

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'hired';

export type JobApplication = {
  _id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  cvId?: string;
  cvTitle?: string;
  matchScore: number;
  status: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMatchedJobs(): Promise<ScoredJob[]> {
  const res = await apiFetch('/hiring/jobs/matches');
  if (!res.ok) throw new Error('Failed to fetch matched jobs.');
  return res.json();
}

export async function fetchAllJobs(): Promise<ScoredJob[]> {
  const res = await apiFetch('/hiring/jobs');
  if (!res.ok) throw new Error('Failed to fetch jobs.');
  return res.json();
}

export async function fetchMyApplications(): Promise<JobApplication[]> {
  const res = await apiFetch('/hiring/applications');
  if (!res.ok) throw new Error('Failed to fetch applications.');
  return res.json();
}

export async function upsertApplication(dto: {
  jobId: string;
  jobTitle: string;
  company: string;
  cvId?: string;
  cvTitle?: string;
  matchScore?: number;
  status?: ApplicationStatus;
  notes?: string;
}): Promise<JobApplication> {
  const res = await apiFetch('/hiring/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit application.');
  }
  return res.json();
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  notes?: string,
): Promise<JobApplication> {
  const res = await apiFetch(`/hiring/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update status.');
  }
  return res.json();
}

export async function closeSkillGap(jobId: string): Promise<{
  success: boolean;
  added: string[];
  message: string;
}> {
  const res = await apiFetch(`/hiring/jobs/${jobId}/close-gap`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to close skill gap.');
  return data;
}
