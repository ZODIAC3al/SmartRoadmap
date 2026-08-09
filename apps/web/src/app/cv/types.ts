// Shared CV document shapes with 14 comprehensive sections.
export type Experience = {
  company: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate: string;
  currentJob?: boolean;
  responsibilities?: string;
  achievements?: string;
  description: string;
};

export type Education = {
  school: string;
  degree: string;
  department?: string;
  fieldOfStudy: string;
  gpa?: string;
  startDate?: string;
  graduateDate: string;
  description?: string;
};

export type Project = {
  name: string;
  description: string;
  technologies?: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  startDate?: string;
  endDate?: string;
  url: string;
};

export type Certification = {
  name: string;
  organization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
};

export type Course = {
  name: string;
  provider: string;
  completionDate: string;
};

export type Language = {
  language: string;
  proficiency: string;
};

export type Volunteer = {
  organization: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
};

export type Publication = {
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
};

export type Reference = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

export type CvAtsAnalysis = {
  overallScore: number;
  matchScore: number;
  formattingScore: number;
  readabilityScore?: number;
  readabilityLevel?: string;
  missingKeywords: string[];
  suggestions: string[];
  grammarSuggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
  skillsAnalysis?: {
    matchedSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
  };
  sectionScores: {
    summary: number;
    experience: number;
    skills: number;
    education: number;
    projects: number;
  };
  jobMatchScore?: number;
  jobMatchAnalysis?: string;
  targetJobTitle?: string;
  evaluatedAt?: string;
};

export type CustomSection = {
  id: string;
  title: string;
  items: string[];
};

export type CvTemplateType = 'classic' | 'modern' | 'minimal' | 'creative';

export type CVData = {
  _id?: string;
  id?: string;
  title?: string;
  template?: CvTemplateType;
  sectionOrder?: string[];
  updatedAt?: string;
  createdAt?: string;
  isDefault?: boolean;
  personal: {
    name: string;
    title?: string;
    email: string;
    phone: string;
    summary: string;
    photoUrl?: string;
    address?: string;
    city?: string;
    country?: string;
    portfolio?: string;
    linkedIn?: string;
    gitHub?: string;
    website?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  softSkills?: string[];
  projects: Project[];
  certifications?: Certification[];
  courses?: Course[];
  languages?: Language[];
  achievements?: string[];
  volunteerExperience?: Volunteer[];
  publications?: Publication[];
  awards?: string[];
  references?: Reference[];
  hobbies?: string[];
  customSections?: CustomSection[];
  atsAnalysis?: CvAtsAnalysis;
};

