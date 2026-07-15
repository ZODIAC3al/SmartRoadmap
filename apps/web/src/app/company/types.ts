// Candidate shape used by the recruiter dashboard.
export type Candidate = {
  userId: string;
  name: string;
  email: string;
  targetRole: string;
  progress: number;
  completedMilestones: number;
  verifiedSkills: string[];
  averageQuizScore: number | null;
  quizzesPassed: number;
  cvUploaded: boolean;
  matchScore?: number; // Simulated vector match score
  interviewPredictor?: number; // AI predicted pass rate
  capstoneProject?: {
    title: string;
    verified: boolean;
    auditLog: string;
  };
};
