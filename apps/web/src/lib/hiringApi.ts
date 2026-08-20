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
  neededSkills?: string[];
  skillsGap?: string[];
  externalUrl?: string;
  postedAt?: string;
  createdAt?: string;
};

export type ApplicationStatus =
  | 'Applied'
  | 'Interviewing'
  | 'Accepted'
  | 'Rejected'
  | 'interested'
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'hired';

export type JobApplication = {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        role?: string;
      };
  jobId: string;
  jobTitle: string;
  company: string;
  companyId?: string;
  cvId?: string;
  cvTitle?: string;
  cvSnapshot?: any;
  passportSnapshot?: any;
  matchScore: number;
  status: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobPayload = {
  title: string;
  company: string;
  location: string;
  country?: string;
  requiredSkills: string[];
  technologies?: string[];
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  workType?: WorkType;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  description: string;
  externalUrl?: string;
};

export async function fetchMatchedJobs(): Promise<ScoredJob[]> {
  const res = await apiFetch('/hiring/jobs/matches');
  if (!res.ok) throw new Error('Failed to fetch matched jobs.');
  return res.json();
}

export async function fetchAllJobs(params?: Record<string, any>): Promise<ScoredJob[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await apiFetch(`/hiring/jobs${qs}`);
  if (!res.ok) throw new Error('Failed to fetch jobs.');
  return res.json();
}

export async function fetchMyJobs(): Promise<ScoredJob[]> {
  const res = await apiFetch('/hiring/jobs/my');
  if (!res.ok) throw new Error('Failed to fetch your posted jobs.');
  return res.json();
}

export async function createJobPosting(dto: CreateJobPayload): Promise<ScoredJob> {
  const res = await apiFetch('/hiring/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create job posting.');
  }
  return res.json();
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  const res = await apiFetch(`/hiring/jobs/${jobId}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete job.');
  }
}

export async function fetchMyApplications(): Promise<JobApplication[]> {
  const res = await apiFetch('/hiring/applications');
  if (!res.ok) throw new Error('Failed to fetch applications.');
  return res.json();
}

export async function fetchCompanyApplications(jobId?: string): Promise<JobApplication[]> {
  const qs = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
  const res = await apiFetch(`/hiring/applications/company${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch candidate applications.');
  }
  return res.json();
}

export async function fetchApplicationById(applicationId: string): Promise<JobApplication> {
  const res = await apiFetch(`/hiring/applications/${applicationId}`);
  if (!res.ok) throw new Error('Failed to load application details.');
  return res.json();
}

export async function upsertApplication(dto: {
  jobId: string;
  jobTitle?: string;
  company?: string;
  cvId?: string;
  cvTitle?: string;
  cvSnapshot?: any;
  passportSnapshot?: any;
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
  const res = await apiFetch(`/hiring/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update application status.');
  }
  return res.json();
}

export async function getNeededSkills(jobId: string): Promise<{
  success: boolean;
  neededSkills: string[];
  matchingSkills: string[];
  jobTitle: string;
  company: string;
  message: string;
}> {
  const res = await apiFetch(`/hiring/jobs/${jobId}/close-gap`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to calculate needed skills.');
  return data;
}
