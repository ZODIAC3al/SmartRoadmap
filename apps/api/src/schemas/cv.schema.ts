import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CVPersonal {
  @Prop()
  name?: string;

  @Prop()
  title?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  summary?: string;

  @Prop()
  photoUrl?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  portfolio?: string;

  @Prop()
  linkedIn?: string;

  @Prop()
  gitHub?: string;

  @Prop()
  website?: string;
}

@Schema({ _id: false })
export class CVExperience {
  @Prop()
  company?: string;

  @Prop()
  role?: string;

  @Prop()
  employmentType?: string;

  @Prop()
  location?: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop({ default: false })
  currentJob?: boolean;

  @Prop()
  responsibilities?: string;

  @Prop()
  achievements?: string;

  @Prop()
  description?: string;
}

@Schema({ _id: false })
export class CVEducation {
  @Prop()
  school?: string;

  @Prop()
  degree?: string;

  @Prop()
  department?: string;

  @Prop()
  fieldOfStudy?: string;

  @Prop()
  gpa?: string;

  @Prop()
  startDate?: string;

  @Prop()
  graduateDate?: string;

  @Prop()
  description?: string;
}

@Schema({ _id: false })
export class CVProject {
  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  technologies?: string[];

  @Prop()
  githubUrl?: string;

  @Prop()
  liveDemoUrl?: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;

  @Prop()
  url?: string;
}

@Schema({ _id: false })
export class CVCertificate {
  @Prop()
  name?: string;

  @Prop()
  organization?: string;

  @Prop()
  issueDate?: string;

  @Prop()
  expirationDate?: string;

  @Prop()
  credentialId?: string;

  @Prop()
  credentialUrl?: string;
}

@Schema({ _id: false })
export class CVCourse {
  @Prop()
  name?: string;

  @Prop()
  provider?: string;

  @Prop()
  completionDate?: string;
}

@Schema({ _id: false })
export class CVLanguage {
  @Prop()
  language?: string;

  @Prop()
  proficiency?: string;
}

@Schema({ _id: false })
export class CVVolunteer {
  @Prop()
  organization?: string;

  @Prop()
  position?: string;

  @Prop()
  description?: string;

  @Prop()
  startDate?: string;

  @Prop()
  endDate?: string;
}

@Schema({ _id: false })
export class CVPublication {
  @Prop()
  title?: string;

  @Prop()
  publisher?: string;

  @Prop()
  date?: string;

  @Prop()
  url?: string;

  @Prop()
  description?: string;
}

@Schema({ _id: false })
export class CVReference {
  @Prop()
  name?: string;

  @Prop()
  relationship?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;
}

@Schema({ _id: false })
export class CvAtsAnalysis {
  @Prop({ default: 0 })
  overallScore!: number;

  @Prop({ default: 0 })
  matchScore!: number;

  @Prop({ default: 0 })
  formattingScore!: number;

  @Prop({ default: 0 })
  readabilityScore!: number;

  @Prop({ default: 'Professional' })
  readabilityLevel!: string;

  @Prop({ type: [String], default: [] })
  missingKeywords!: string[];

  @Prop({ type: [String], default: [] })
  suggestions!: string[];

  @Prop({ type: [String], default: [] })
  grammarSuggestions!: string[];

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [String], default: [] })
  weaknesses!: string[];

  @Prop({ type: Object, default: {} })
  skillsAnalysis!: {
    matchedSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
  };

  @Prop({ type: Object, default: {} })
  sectionScores!: {
    summary: number;
    experience: number;
    skills: number;
    education: number;
    projects: number;
  };

  @Prop({ default: 0 })
  jobMatchScore?: number;

  @Prop()
  jobMatchAnalysis?: string;

  @Prop()
  targetJobTitle?: string;

  @Prop()
  evaluatedAt?: Date;
}

@Schema({ timestamps: true })
export class Cv extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ default: 'My Resume' })
  title!: string;

  @Prop({ default: 'modern' })
  template!: string;

  @Prop({
    type: [String],
    default: [
      'summary',
      'experience',
      'projects',
      'skills',
      'education',
      'certifications',
      'courses',
      'languages',
      'volunteerExperience',
      'publications',
      'awards',
      'references',
      'hobbies',
    ],
  })
  sectionOrder!: string[];

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ type: CVPersonal })
  personal?: CVPersonal;

  @Prop({ type: [CVExperience], default: [] })
  experience!: CVExperience[];

  @Prop({ type: [CVEducation], default: [] })
  education!: CVEducation[];

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [String], default: [] })
  softSkills!: string[];

  @Prop({ type: [CVProject], default: [] })
  projects!: CVProject[];

  @Prop({ type: [CVCertificate], default: [] })
  certifications!: CVCertificate[];

  @Prop({ type: [CVCourse], default: [] })
  courses!: CVCourse[];

  @Prop({ type: [CVLanguage], default: [] })
  languages!: CVLanguage[];

  @Prop({ type: [String], default: [] })
  achievements!: string[];

  @Prop({ type: [CVVolunteer], default: [] })
  volunteerExperience!: CVVolunteer[];

  @Prop({ type: [CVPublication], default: [] })
  publications!: CVPublication[];

  @Prop({ type: [String], default: [] })
  awards!: string[];

  @Prop({ type: [CVReference], default: [] })
  references!: CVReference[];

  @Prop({ type: [String], default: [] })
  hobbies!: string[];

  /** User-defined free-form sections (title + bullet items). */
  @Prop({ type: [Object], default: [] })
  customSections!: Array<{ id: string; title: string; items: string[] }>;

  @Prop()
  fileUrl?: string;

  @Prop({ type: CvAtsAnalysis })
  atsAnalysis?: CvAtsAnalysis;
}

export const CvSchema = SchemaFactory.createForClass(Cv);
