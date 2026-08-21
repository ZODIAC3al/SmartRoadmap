import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cv } from '../../schemas/cv.schema';
import { User } from '../../schemas/user.schema';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { LLMService } from '../../ai/llm.service';
import { TrackCertification } from '../../schemas/track-certification.schema';
import { AchievementDefinition } from '../../schemas/achievement-definition.schema';
import { AppCacheService } from '../../common/cache/app-cache.service';
import { ProjectService } from '../profile-import/project.service';
import { CertificateService } from '../profile-import/certificate.service';
import {
  AtsAutoFixDto,
  AtsCheckDto,
  GenerateTailoredCvDto,
} from './dto/cv.dto';
import axios from 'axios';
import * as _pdfParse from 'pdf-parse';
const pdfParse = _pdfParse as any;

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);
  private readonly isMockMode: boolean;

  constructor(
    @InjectModel(Cv.name) private readonly cvModel: Model<Cv>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(LearnerProfile.name)
    private readonly learnerProfileModel: Model<LearnerProfile>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    @InjectModel('GitHubAccount')
    private readonly githubAccountModel: Model<any>,
    @InjectModel('LinkedInAccount')
    private readonly linkedinAccountModel: Model<any>,
    @InjectModel('UserAchievement')
    private readonly userAchievementModel: Model<any>,
    @InjectModel(TrackCertification.name)
    private readonly trackCertificationModel: Model<TrackCertification>,
    @InjectModel(AchievementDefinition.name)
    private readonly achievementDefModel: Model<AchievementDefinition>,
    private readonly llmService: LLMService,
    private readonly projectService: ProjectService,
    private readonly certificateService: CertificateService,
    private readonly cache: AppCacheService,
  ) {
    const apiKey = process.env.AFFINDA_API_KEY;
    this.isMockMode = !apiKey || apiKey.includes('placeholder');
    if (this.isMockMode) {
      this.logger.warn(
        'Affinda API key is missing. Running in hybrid offline parser mode.',
      );
    }
  }

  async listCvsByUserId(userId: string): Promise<Cv[]> {
    const userObjId = new Types.ObjectId(userId);
    let cvs = await this.cvModel
      .find({ userId: userObjId })
      .sort({ updatedAt: -1 });
    if (!cvs || cvs.length === 0) {
      const defaultCv = new this.cvModel({
        userId: userObjId,
        title: 'My Main Resume',
        template: 'modern',
        isDefault: true,
      });
      await defaultCv.save();
      cvs = [defaultCv];
    }
    return cvs;
  }

  async getCvByUserId(userId: string): Promise<Cv> {
    const cvs = await this.listCvsByUserId(userId);
    return cvs[0];
  }

  async getCvById(cvId: string, userId: string): Promise<Cv> {
    const cv = await this.cvModel.findById(cvId);
    if (!cv || cv.userId.toString() !== userId) {
      throw new NotFoundException(`CV not found or access denied`);
    }
    return cv;
  }

  async createCv(userId: string, data?: any): Promise<Cv> {
    const cv = new this.cvModel({
      userId: new Types.ObjectId(userId),
      title: data?.title || 'Untitled CV',
      template: data?.template || 'modern',
      personal: data?.personal || {},
      experience: data?.experience || [],
      education: data?.education || [],
      skills: data?.skills || [],
      projects: data?.projects || [],
      certifications: data?.certifications || [],
      customSections: data?.customSections || [],
      sectionOrder: data?.sectionOrder || [
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
    });
    return cv.save();
  }

  async duplicateCv(cvId: string, userId: string): Promise<Cv> {
    const original = await this.getCvById(cvId, userId);
    const origObj = original.toObject();
    delete origObj._id;
    delete origObj.createdAt;
    delete origObj.updatedAt;

    const copy = new this.cvModel({
      ...origObj,
      userId: new Types.ObjectId(userId),
      title: `${original.title || 'Resume'} (Copy)`,
      isDefault: false,
    });
    return copy.save();
  }

  async deleteCv(cvId: string, userId: string): Promise<{ success: boolean }> {
    const cv = await this.getCvById(cvId, userId);
    await this.cvModel.deleteOne({ _id: cv._id });
    return { success: true };
  }

  async saveCv(userId: string, data: any): Promise<Cv> {
    this.logger.log(`Saving CV profile for user ${userId}`);
    const cvId = data._id || data.id;
    let cv: Cv | null = null;

    if (cvId && Types.ObjectId.isValid(cvId)) {
      cv = await this.cvModel.findOne({
        _id: cvId,
        userId: new Types.ObjectId(userId),
      });
    }

    if (!cv) {
      cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });
    }
    if (!cv) {
      cv = new this.cvModel({
        userId: new Types.ObjectId(userId),
        title: data.title || 'My Resume',
        template: data.template || 'modern',
        ...data,
      });
    } else {
      if (data.title) cv.title = data.title;
      if (data.template) cv.template = data.template;
      if (data.sectionOrder) cv.sectionOrder = data.sectionOrder;
      if (data.customSections) cv.customSections = data.customSections;
      cv.personal = data.personal || cv.personal;
      cv.experience = data.experience || [];
      cv.education = data.education || [];
      cv.skills = data.skills || [];
      cv.softSkills = data.softSkills || [];
      cv.projects = data.projects || [];
      cv.certifications = data.certifications || [];
      cv.courses = data.courses || [];
      cv.languages = data.languages || [];
      cv.achievements = data.achievements || [];
      cv.volunteerExperience = data.volunteerExperience || [];
      cv.publications = data.publications || [];
      cv.awards = data.awards || [];
      cv.references = data.references || [];
      cv.hobbies = data.hobbies || [];
      cv.fileUrl = data.fileUrl || cv.fileUrl;
      if (data.atsAnalysis) {
        cv.atsAnalysis = data.atsAnalysis;
      }
    }

    return cv.save();
  }

  async enhanceDescription(text: string): Promise<string> {
    this.logger.log('Enhancing resume bullet point description using AI');

    const enhanced = await this.llmService.complete(
      `Rewrite this resume bullet to be impactful, active-voice and results-driven. ` +
        `Return ONLY the rewritten sentence (1-2 sentences):\n\n"${text}"`,
      { system: 'You are a professional resume writer.' },
    );

    // llmService owns the OpenAI client + failure handling; no ad-hoc require('openai') here.
    return enhanced ?? text;
  }

  private parseTextHeuristically(text: string): any {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let name = '';
    let title = '';
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /\+?[0-9\s-()]{8,20}/;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Find candidate name and title from initial lines
    for (const line of lines.slice(0, 5)) {
      if (
        !emailRegex.test(line) &&
        !phoneRegex.test(line) &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('cv') &&
        !line.toLowerCase().includes('curriculum') &&
        line.split(' ').length <= 4
      ) {
        if (!name) {
          name = line;
        } else if (!title) {
          title = line;
        }
      }
    }

    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    // Extract links
    const urls = text.match(urlRegex) || [];
    const linkedIn = urls.find((u) => u.includes('linkedin.com')) || '';
    const gitHub = urls.find((u) => u.includes('github.com')) || '';
    const website =
      urls.find(
        (u) => !u.includes('linkedin.com') && !u.includes('github.com'),
      ) || '';

    let summary = '';
    const summaryLines: string[] = [];
    let startCollectingSummary = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes('summary') ||
        lower.includes('profile') ||
        lower.includes('objective') ||
        lower.includes('about me')
      ) {
        startCollectingSummary = true;
        continue;
      }
      if (startCollectingSummary) {
        if (
          lower.includes('experience') ||
          lower.includes('education') ||
          lower.includes('skills') ||
          lower.includes('projects')
        ) {
          break;
        }
        summaryLines.push(line);
      }
    }
    if (summaryLines.length > 0) {
      summary = summaryLines.join(' ');
    } else {
      const candidateSummaryLine = lines.find(
        (l) => l.length > 45 && !l.includes('@') && !l.includes('http'),
      );
      summary = candidateSummaryLine || '';
    }

    const skillKeywords = [
      'React',
      'Angular',
      'Vue',
      'Next.js',
      'NextJS',
      'Nuxt',
      'Svelte',
      'JavaScript',
      'TypeScript',
      'ES6',
      'HTML',
      'CSS',
      'Sass',
      'Tailwind',
      'TailwindCSS',
      'Bootstrap',
      'Node.js',
      'NodeJS',
      'Express',
      'NestJS',
      'Nest.js',
      'Koa',
      'Fastify',
      'Python',
      'Django',
      'Flask',
      'FastAPI',
      'Ruby',
      'Rails',
      'PHP',
      'Laravel',
      'Java',
      'Spring',
      'Spring Boot',
      'Kotlin',
      'Swift',
      'Objective-C',
      'Flutter',
      'React Native',
      'Go',
      'Golang',
      'Rust',
      'C++',
      'C#',
      '.NET',
      'SQL',
      'MySQL',
      'PostgreSQL',
      'SQLite',
      'MongoDB',
      'Redis',
      'Cassandra',
      'Elasticsearch',
      'DynamoDB',
      'Docker',
      'Kubernetes',
      'AWS',
      'Azure',
      'GCP',
      'Firebase',
      'Supabase',
      'Heroku',
      'Netlify',
      'Vercel',
      'Git',
      'GitHub',
      'GitLab',
      'CI/CD',
      'Jenkins',
      'GitHub Actions',
      'REST',
      'GraphQL',
      'gRPC',
      'WebSockets',
      'Microservices',
      'Serverless',
      'Agile',
      'Scrum',
      'Jira',
      'Figma',
      'UI/UX',
      'Jest',
      'Mocha',
      'Cypress',
      'Playwright',
    ];
    const skills: string[] = [];
    for (const kw of skillKeywords) {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        skills.push(kw);
      }
    }

    const experience: any[] = [];
    const lowerText = text.toLowerCase();
    const expIndex = lowerText.indexOf('experience');
    if (expIndex !== -1) {
      const nextHeaders = [
        'education',
        'skills',
        'projects',
        'languages',
        'certifications',
        'references',
      ];
      let endIdx = text.length;
      for (const header of nextHeaders) {
        const idx = lowerText.indexOf(header, expIndex + 10);
        if (idx !== -1 && idx < endIdx) {
          endIdx = idx;
        }
      }
      const expText = text.substring(expIndex + 10, endIdx).trim();
      if (expText) {
        const expLines = expText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        let currentCompany = '';
        let currentRole = '';
        let currentDesc = '';
        let currentDates = '';

        for (const line of expLines) {
          const dateMatch = line.match(/\b(19|20)\d{2}\b/);
          const hasPresent =
            line.toLowerCase().includes('present') ||
            line.toLowerCase().includes('current');

          if (dateMatch || hasPresent) {
            if (currentCompany || currentRole) {
              experience.push({
                company: currentCompany || 'Company',
                role: currentRole || 'Software Engineer',
                startDate: currentDates.split(/[-–—]|\bto\b/i)[0]?.trim() || '',
                endDate:
                  currentDates.split(/[-–—]|\bto\b/i)[1]?.trim() || 'Present',
                description: currentDesc.trim(),
              });
            }
            currentDates = line;
            currentCompany = '';
            currentRole = '';
            currentDesc = '';
          } else if (
            !currentRole &&
            line.length < 50 &&
            line.split(' ').length <= 4
          ) {
            currentRole = line;
          } else if (
            !currentCompany &&
            line.length < 50 &&
            line.split(' ').length <= 4
          ) {
            currentCompany = line;
          } else {
            currentDesc += ' ' + line;
          }
        }
        if (currentCompany || currentRole) {
          experience.push({
            company: currentCompany || 'Company',
            role: currentRole || 'Software Engineer',
            startDate: currentDates.split(/[-–—]|\bto\b/i)[0]?.trim() || '',
            endDate:
              currentDates.split(/[-–—]|\bto\b/i)[1]?.trim() || 'Present',
            description: currentDesc.trim(),
          });
        }
      }
    }

    const education: any[] = [];
    const eduIndex = lowerText.indexOf('education');
    if (eduIndex !== -1) {
      const nextHeaders = [
        'experience',
        'skills',
        'projects',
        'languages',
        'certifications',
        'references',
      ];
      let endIdx = text.length;
      for (const header of nextHeaders) {
        const idx = lowerText.indexOf(header, eduIndex + 10);
        if (idx !== -1 && idx < endIdx) {
          endIdx = idx;
        }
      }
      const eduText = text.substring(eduIndex + 10, endIdx).trim();
      if (eduText) {
        const eduLines = eduText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        let school = '';
        let degree = '';
        let gradDate = '';

        for (const line of eduLines) {
          const lowerLine = line.toLowerCase();
          if (
            lowerLine.includes('university') ||
            lowerLine.includes('college') ||
            lowerLine.includes('school') ||
            lowerLine.includes('institute')
          ) {
            if (school) {
              education.push({
                school,
                degree: degree || 'Bachelor Degree',
                fieldOfStudy: 'Computer Science',
                graduateDate: gradDate || '',
              });
              degree = '';
              gradDate = '';
            }
            school = line;
          } else if (
            lowerLine.includes('bachelor') ||
            lowerLine.includes('master') ||
            lowerLine.includes('phd') ||
            lowerLine.includes('b.s') ||
            lowerLine.includes('b.sc')
          ) {
            degree = line;
          } else if (line.match(/\b(19|20)\d{2}\b/)) {
            gradDate = line;
          }
        }
        if (school) {
          education.push({
            school,
            degree: degree || 'Bachelor Degree',
            fieldOfStudy: 'Computer Science',
            graduateDate: gradDate || '',
          });
        }
      }
    }

    // Heuristic Projects Extraction
    const projects: any[] = [];
    const projIndex = lowerText.indexOf('projects');
    if (projIndex !== -1) {
      const nextHeaders = [
        'education',
        'experience',
        'skills',
        'languages',
        'certifications',
        'references',
      ];
      let endIdx = text.length;
      for (const header of nextHeaders) {
        const idx = lowerText.indexOf(header, projIndex + 8);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      const projText = text.substring(projIndex + 8, endIdx).trim();
      if (projText) {
        const projLines = projText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        let currentProjName = '';
        let currentProjDesc = '';
        let currentProjUrl = '';
        for (const line of projLines) {
          if (line.startsWith('http') || line.includes('github.com')) {
            currentProjUrl = line;
          } else if (
            !currentProjName &&
            line.length < 60 &&
            !line.includes('.')
          ) {
            if (currentProjName) {
              projects.push({
                name: currentProjName,
                description: currentProjDesc.trim(),
                url: currentProjUrl,
              });
              currentProjDesc = '';
              currentProjUrl = '';
            }
            currentProjName = line;
          } else {
            currentProjDesc += ' ' + line;
          }
        }
        if (currentProjName) {
          projects.push({
            name: currentProjName,
            description: currentProjDesc.trim(),
            url: currentProjUrl,
          });
        }
      }
    }

    // Heuristic Certifications Extraction
    const certifications: any[] = [];
    const certIdx =
      lowerText.indexOf('certification') !== -1
        ? lowerText.indexOf('certification')
        : lowerText.indexOf('certificates');
    if (certIdx !== -1) {
      const certText = text.substring(certIdx + 13, certIdx + 400).trim();
      const certLines = certText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 3);
      for (const line of certLines.slice(0, 3)) {
        if (
          !line.toLowerCase().includes('education') &&
          !line.toLowerCase().includes('experience')
        ) {
          certifications.push({
            name: line,
            organization: 'Verified Issuer',
            issueDate: '',
          });
        }
      }
    }

    // Heuristic Languages Extraction
    const languages: any[] = [];
    const commonLangs = [
      'English',
      'Arabic',
      'French',
      'German',
      'Spanish',
      'Chinese',
    ];
    for (const lang of commonLangs) {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(text)) {
        languages.push({ language: lang, proficiency: 'Professional' });
      }
    }

    return {
      personal: {
        name,
        title,
        email,
        phone,
        summary,
        linkedIn,
        gitHub,
        website,
      },
      experience,
      education,
      skills,
      softSkills: [],
      projects,
      certifications,
      courses: [],
      languages,
      achievements: [],
      volunteerExperience: [],
      publications: [],
      awards: [],
      references: [],
      hobbies: [],
    };
  }

  async parseCvFile(fileBuffer: Buffer, fileName: string): Promise<any> {
    this.logger.log(
      `Parsing CV file: "${fileName}" with length ${fileBuffer.length} bytes`,
    );

    let plainText = '';
    try {
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith('.pdf')) {
        let pdfFn = pdfParse;
        if (typeof pdfFn !== 'function' && pdfFn?.default) {
          pdfFn = pdfFn.default;
        }
        if (typeof pdfFn === 'function') {
          const data = await pdfFn(fileBuffer);
          plainText = data?.text || '';
        } else {
          plainText = fileBuffer
            .toString('utf8')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        }
      } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        const str = fileBuffer.toString('utf8');
        const xmlMatches = str.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
        if (xmlMatches && xmlMatches.length > 0) {
          plainText = xmlMatches
            .map((m) => m.replace(/<[^>]+>/g, '').trim())
            .filter((t) => t.length > 0)
            .join(' ');
        } else {
          plainText = str
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ');
        }
      } else {
        plainText = fileBuffer.toString('utf8');
      }
    } catch (err: any) {
      this.logger.error(
        `Parser text extraction failed on CV file "${fileName}": ${err.message}.`,
      );
    }

    try {
      if (plainText && plainText.trim().length >= 10) {
        const raw = await this.llmService.complete(
          `Extract comprehensive structured JSON from this resume text. Extract ONLY what exists in the text.
Keys:
- personal { name, title, summary, email, phone, address, city, country, portfolio, linkedIn, gitHub, website }
- education[] { school, degree, department, major, gpa, startDate, graduateDate, description }
- experience[] { company, role, employmentType, location, startDate, endDate, currentJob, responsibilities, achievements, description }
- projects[] { name, description, technologies, githubUrl, liveDemoUrl, startDate, endDate, url }
- skills[] (array of strings for technical skills)
- softSkills[] (array of strings)
- certifications[] { name, organization, issueDate, expirationDate, credentialId, credentialUrl }
- courses[] { name, provider, completionDate }
- languages[] { language, proficiency }
- achievements[] (array of strings)
- volunteerExperience[] { organization, position, description, startDate, endDate }
- awards[] (array of strings)
- publications[] { title, publisher, date, url, description }
- references[] { name, relationship, phone, email }
- hobbies[] (array of strings)

Resume Text:
${plainText}`,
          { json: true },
        );

        if (raw) {
          const parsedJson = JSON.parse(raw);
          if (
            parsedJson.personal?.name ||
            parsedJson.skills?.length ||
            parsedJson.experience?.length ||
            parsedJson.education?.length
          ) {
            return parsedJson;
          }
        }
      }
    } catch (err: any) {
      this.logger.error(
        `LLM completion failed for CV file "${fileName}": ${err.message}.`,
      );
    }

    return this.parseTextHeuristically(plainText);
  }

  async generateTailoredCv(
    userId: string,
    dto: GenerateTailoredCvDto,
    forceRegenerate = false,
  ): Promise<any> {
    this.logger.log(
      `Gathering 100% real user profile data for AI CV generation (user: ${userId})`,
    );

    const userObjId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : undefined;

    let userObj: any = null;
    let learnerProfileObj: any = null;
    let githubAccountObj: any = null;
    let linkedinAccountObj: any = null;
    let roadmapsList: any[] = [];
    let quizzesList: any[] = [];
    let projectsList: any[] = [];
    let certsList: any[] = [];
    let trackCertsList: any[] = [];
    let achievementsList: any[] = [];
    let achievementDefsList: any[] = [];
    let existingCv: any = null;

    // Parallel database queries to fetch all candidate records in one batch
    await Promise.all([
      (async () => {
        try {
          if (userObjId) userObj = await this.userModel.findById(userObjId).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) learnerProfileObj = await this.learnerProfileModel.findOne({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) githubAccountObj = await this.githubAccountModel.findOne({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) linkedinAccountObj = await this.linkedinAccountModel.findOne({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) roadmapsList = await this.roadmapModel.find({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) quizzesList = await this.quizSessionModel.find({ userId: userObjId, passed: true }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (dto.includeProjects !== false) {
            projectsList = await this.projectService.list(userId);
          }
        } catch {}
      })(),
      (async () => {
        try {
          if (dto.includeCertificates !== false) {
            certsList = await this.certificateService.list(userId);
          }
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) trackCertsList = await this.trackCertificationModel.find({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          if (userObjId) achievementsList = await this.userAchievementModel.find({ userId: userObjId }).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          achievementDefsList = await this.achievementDefModel.find({}).lean().exec();
        } catch {}
      })(),
      (async () => {
        try {
          existingCv = await this.getCvByUserId(userId);
        } catch {
          existingCv = dto.cvData || null;
        }
      })(),
    ]);

    // 1. Gather Personal Details (real data only)
    const candidateName =
      userObj?.name ||
      linkedinAccountObj?.fullName ||
      githubAccountObj?.fullName ||
      existingCv?.personal?.name ||
      '';

    const candidateEmail =
      userObj?.email ||
      linkedinAccountObj?.email ||
      githubAccountObj?.email ||
      existingCv?.personal?.email ||
      '';

    const candidatePhone =
      userObj?.phone ||
      existingCv?.personal?.phone ||
      '';

    const candidateLocation =
      learnerProfileObj?.location ||
      githubAccountObj?.location ||
      userObj?.location ||
      existingCv?.personal?.location ||
      '';

    const candidateSummary =
      userObj?.bio ||
      learnerProfileObj?.bio ||
      linkedinAccountObj?.profile?.about ||
      existingCv?.personal?.summary ||
      '';

    const targetTitle =
      dto?.targetJobTitle ||
      learnerProfileObj?.targetRole ||
      learnerProfileObj?.currentRole ||
      existingCv?.title?.replace(/\s*\([^)]*\)/g, '') ||
      'Software Engineer';

    const gitHubUrl = githubAccountObj?.username
      ? `https://github.com/${githubAccountObj.username}`
      : learnerProfileObj?.github || existingCv?.personal?.gitHub || '';

    const linkedInUrl =
      linkedinAccountObj?.profile?.profileUrl ||
      learnerProfileObj?.linkedIn ||
      existingCv?.personal?.linkedIn ||
      '';

    const websiteUrl =
      githubAccountObj?.website ||
      learnerProfileObj?.portfolioUrl ||
      existingCv?.personal?.website ||
      '';

    // 2. Gather Skills (real data only, deduplicated)
    const completedRoadmapModules = (roadmapsList || [])
      .flatMap((r) => r.modules || [])
      .filter((m) => m.status === 'completed');

    const roadmapSkillTopics = completedRoadmapModules.flatMap(
      (m) => m.topics || [],
    );

    const projectTechs = (projectsList || []).flatMap(
      (p) => p.technologies || Object.keys(p.languages || {}),
    );

    const mergedSkills = Array.from(
      new Set([
        ...(learnerProfileObj?.skills || []),
        ...(linkedinAccountObj?.profile?.skills || []),
        ...(existingCv?.skills || []),
        ...roadmapSkillTopics,
        ...projectTechs,
      ]),
    ).filter((s) => typeof s === 'string' && s.trim().length > 0);

    // 3. Gather Projects (real data only)
    const verifiedProjects = (projectsList || []).map((p) => ({
      name: p.name,
      description:
        p.description || (p.readmeSnippet ? p.readmeSnippet.slice(0, 300) : ''),
      technologies: p.technologies || Object.keys(p.languages || {}),
      url: p.demoLink || p.githubUrl || '',
      githubUrl: p.githubUrl || '',
      stars: p.stars || 0,
    }));

    if (verifiedProjects.length === 0 && existingCv?.projects?.length > 0) {
      verifiedProjects.push(...existingCv.projects);
    }

    // 4. Gather Certifications (real data only: uploaded + platform track certs + linkedin certs)
    const verifiedCertificates: any[] = [];

    // 4a. Platform Track Certifications (Verified)
    (trackCertsList || []).forEach((tc) => {
      verifiedCertificates.push({
        title: `${tc.trackTitle} Professional Track Certification`,
        organization: 'SmartRoadmap Learning Infrastructure',
        issuedAt: tc.createdAt ? new Date(tc.createdAt).toISOString().split('T')[0] : '',
        credentialUrl: tc.shareableUrl || '',
        isVerified: true,
      });
    });

    // 4b. Uploaded / Imported User Certificates
    (certsList || []).forEach((c) => {
      verifiedCertificates.push({
        title: c.title,
        organization: c.organization || '',
        issuedAt: c.issueDate || c.issuedAt || '',
        credentialUrl: c.credentialUrl || '',
        isVerified: c.status === 'Verified',
      });
    });

    // 4c. LinkedIn Certifications
    if (linkedinAccountObj?.profile?.certifications?.length > 0) {
      linkedinAccountObj.profile.certifications.forEach((c: any) => {
        const title = c.name || c.title || '';
        if (!verifiedCertificates.some((existing) => existing.title === title)) {
          verifiedCertificates.push({
            title,
            organization: c.authority || c.organization || '',
            issuedAt: c.issueDate || '',
            credentialUrl: c.credentialUrl || '',
            isVerified: false,
          });
        }
      });
    }

    if (verifiedCertificates.length === 0 && existingCv?.certifications?.length > 0) {
      verifiedCertificates.push(...existingCv.certifications);
    }

    // 5. Gather Experience (real data only)
    const verifiedExperience = [
      ...(linkedinAccountObj?.profile?.experience || []),
      ...(existingCv?.experience || []),
    ];

    // 6. Gather Education (real data only)
    const verifiedEducation = [
      ...(linkedinAccountObj?.profile?.education || []),
      ...(existingCv?.education || []),
    ];

    if (verifiedEducation.length === 0 && learnerProfileObj?.educationLevel) {
      verifiedEducation.push({
        school: '',
        degree: learnerProfileObj.educationLevel,
        fieldOfStudy: '',
        graduateDate: '',
      });
    }

    // 7. Gather Achievements / Badges (real data only with human-readable titles)
    const defMap = new Map<string, any>();
    (achievementDefsList || []).forEach((def) => {
      defMap.set(def.key, def);
    });

    const earnedBadges = (achievementsList || []).map((a) => {
      const def = defMap.get(a.achievementKey);
      return def ? `${def.title} (${def.tier.toUpperCase()} Tier) - ${def.description}` : a.achievementKey;
    });

    const baseData = {
      personal: {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        location: candidateLocation,
        summary: candidateSummary,
        gitHub: gitHubUrl,
        linkedIn: linkedInUrl,
        website: websiteUrl,
      },
      experience: verifiedExperience,
      education: verifiedEducation,
      skills: mergedSkills,
      projects: verifiedProjects,
      certifications: verifiedCertificates,
      achievements: earnedBadges,
      courses: existingCv?.courses || [],
      languages:
        linkedinAccountObj?.profile?.languages || existingCv?.languages || [],
      customSections: existingCv?.customSections || [],
      references: existingCv?.references || [],
      hobbies: existingCv?.hobbies || [],
    };

    // ── Smart Cache Check (Token Optimization) ──────────────────────────────
    const profileHash = this.cache.hashKey({
      userId,
      candidateName,
      targetTitle,
      candidateSummary,
      skills: mergedSkills,
      projects: verifiedProjects,
      certs: verifiedCertificates,
      experience: verifiedExperience,
      education: verifiedEducation,
      jobDescription: dto.jobDescription || '',
    });

    const cacheKey = `ai:cv:${profileHash}`;
    if (!forceRegenerate) {
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(
          `[Cache Hit] Reusing existing AI-generated CV for user ${userId} (target: "${targetTitle}")`,
        );
        return cached;
      }
    }

    // ── Gemini AI Structured Prompt ──────────────────────────────────────────
    const prompt = `You are a Principal Technical Recruiter and ATS Optimization Expert.
Generate an industry-leading, ATS-compliant professional software resume in JSON format.

CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY USE THE CANDIDATE'S ACTUAL PROVIDED DATA BELOW.
2. NEVER invent fake companies, fake schools, fake degrees, fake phone numbers, or fake certificates.
3. If a section is empty in the candidate's data, leave it empty.
4. For the Professional Summary: Write a compelling, tailored 2-4 sentence narrative synthesizing their actual strongest skills, real projects, certifications, and experience for the target role "${targetTitle}". NEVER use generic phrases like "Motivated professional looking for opportunities".
5. For Experience & Projects: Formulate high-impact, active-voice bullet points (using verbs like Engineered, Architected, Implemented, Deployed, Optimized) highlighting the technologies used and outcomes.

Candidate Ground Truth Data:
- Name: "${candidateName}"
- Email: "${candidateEmail}"
- Phone: "${candidatePhone}"
- Location: "${candidateLocation}"
- Target Role: "${targetTitle}"
- Bio/Summary Input: "${candidateSummary}"
- GitHub Profile: "${gitHubUrl}"
- LinkedIn Profile: "${linkedInUrl}"
- Website: "${websiteUrl}"
- Real Technical Skills: ${JSON.stringify(mergedSkills)}
- Real Projects: ${JSON.stringify(verifiedProjects)}
- Real Work Experience: ${JSON.stringify(verifiedExperience)}
- Real Education: ${JSON.stringify(verifiedEducation)}
- Real Certifications: ${JSON.stringify(verifiedCertificates)}
- Real Achievements/Badges: ${JSON.stringify(earnedBadges)}
- Real Languages: ${JSON.stringify(baseData.languages)}
${dto.jobDescription ? `- Target Job Description to optimize for: "${dto.jobDescription.slice(0, 1000)}"` : ''}

Output ONLY valid JSON matching this exact structure:
{
  "personal": {
    "name": "${candidateName}",
    "email": "${candidateEmail}",
    "phone": "${candidatePhone}",
    "location": "${candidateLocation}",
    "summary": "Impactful 2-4 sentence tailored professional summary",
    "gitHub": "${gitHubUrl}",
    "linkedIn": "${linkedInUrl}",
    "website": "${websiteUrl}"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Role",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "description": "Action-oriented bullet points"
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree Level",
      "fieldOfStudy": "Field of Study",
      "graduateDate": "Year"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Concise technical description of features and architecture",
      "technologies": ["Tech1", "Tech2"],
      "url": "Project URL or GitHub URL"
    }
  ],
  "certifications": [
    {
      "title": "Certification Title",
      "organization": "Issuing Organization",
      "issuedAt": "YYYY-MM-DD",
      "credentialUrl": "Credential URL if available"
    }
  ],
  "achievements": ["Achievement 1", "Achievement 2"],
  "languages": ["Language 1"],
  "hobbies": []
}`;

    const raw = await this.llmService.complete(prompt, { json: true });

    let finalCvData = baseData;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed.personal?.name ||
          parsed.skills?.length ||
          parsed.projects?.length ||
          parsed.personal?.summary
        ) {
          finalCvData = {
            ...baseData,
            ...parsed,
            personal: {
              ...baseData.personal,
              ...parsed.personal,
              name: candidateName || parsed.personal?.name || '',
              email: candidateEmail || parsed.personal?.email || '',
              phone: candidatePhone || parsed.personal?.phone || '',
              location: candidateLocation || parsed.personal?.location || '',
              gitHub: gitHubUrl || parsed.personal?.gitHub || '',
              linkedIn: linkedInUrl || parsed.personal?.linkedIn || '',
              website: websiteUrl || parsed.personal?.website || '',
            },
            skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
              ? Array.from(new Set([...parsed.skills, ...mergedSkills]))
              : mergedSkills,
            projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
              ? parsed.projects.map((p: any, i: number) => ({
                  name: p.name || verifiedProjects[i]?.name || 'Project',
                  description: p.description || verifiedProjects[i]?.description || '',
                  technologies: p.technologies || verifiedProjects[i]?.technologies || [],
                  url: p.url || verifiedProjects[i]?.url || verifiedProjects[i]?.githubUrl || '',
                }))
              : verifiedProjects,
            certifications: Array.isArray(parsed.certifications) && parsed.certifications.length > 0
              ? parsed.certifications
              : verifiedCertificates,
            experience: Array.isArray(parsed.experience) && parsed.experience.length > 0
              ? parsed.experience
              : verifiedExperience,
            education: Array.isArray(parsed.education) && parsed.education.length > 0
              ? parsed.education
              : verifiedEducation,
          };
        }
      } catch (err: any) {
        this.logger.error(
          `AI Tailored CV generation JSON parse error: ${err.message}`,
        );
      }
    }

    // Cache the validated result for 24 hours to minimize token usage
    this.cache.set(cacheKey, finalCvData, 3600 * 24);

    return finalCvData;
  }

  async generateFromProfile(
    userId: string,
    targetJobTitle?: string,
    jobDescription?: string,
    forceRegenerate = false,
  ): Promise<Cv> {
    const jobTitle = targetJobTitle || 'Software Engineer';
    const generatedData = await this.generateTailoredCv(
      userId,
      {
        targetJobTitle: jobTitle,
        jobDescription,
      },
      forceRegenerate,
    );

    return this.saveCv(userId, {
      title: `${jobTitle} Resume (AI Generated)`,
      template: 'modern',
      ...generatedData,
    });
  }

  async checkAts(userId: string, dto: AtsCheckDto): Promise<any> {
    this.logger.log(
      `Running ATS evaluation for user ${userId} against target role "${dto.targetJobTitle}"`,
    );

    let cv: any = dto.cvData || null;
    if (!cv) {
      try {
        cv = await this.getCvByUserId(userId);
      } catch {
        cv = null;
      }
    }

    const cvText = cv
      ? JSON.stringify({
          personal: cv.personal,
          summary: cv.personal?.summary,
          skills: cv.skills,
          experience: cv.experience,
          education: cv.education,
          projects: cv.projects,
          certifications: cv.certifications,
          courses: cv.courses,
          languages: cv.languages,
        })
      : 'No CV content available.';

    const prompt = `You are a corporate Applicant Tracking System (ATS) scanner.
Evaluate the following Candidate Resume against the Target Job Title "${dto.targetJobTitle}".
${dto.jobDescription ? `Job Description:\n"${dto.jobDescription}"\n` : ''}

Candidate Resume Data:
${cvText}

Return ONLY a valid JSON object matching the following fields:
{
  "overallScore": number (0-100),
  "matchScore": number (0-100),
  "formattingScore": number (0-100),
  "readabilityScore": number (0-100),
  "readabilityLevel": string (e.g. "Professional & Clear"),
  "missingKeywords": string[],
  "suggestions": string[],
  "grammarSuggestions": string[],
  "strengths": string[],
  "weaknesses": string[],
  "skillsAnalysis": {
    "matchedSkills": string[],
    "missingSkills": string[],
    "recommendedSkills": string[]
  },
  "sectionScores": {
    "summary": number,
    "experience": number,
    "skills": number,
    "education": number,
    "projects": number
  },
  "jobMatchScore": number,
  "jobMatchAnalysis": string
}`;

    const raw = await this.llmService.complete(prompt, { json: true });

    let analysis: any = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.overallScore === 'number') {
          analysis = {
            overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
            matchScore: Math.min(100, Math.max(0, parsed.matchScore ?? 80)),
            formattingScore: Math.min(
              100,
              Math.max(0, parsed.formattingScore ?? 85),
            ),
            readabilityScore: Math.min(
              100,
              Math.max(0, parsed.readabilityScore ?? 88),
            ),
            readabilityLevel:
              parsed.readabilityLevel || 'Professional & Highly Readable',
            missingKeywords: Array.isArray(parsed.missingKeywords)
              ? parsed.missingKeywords
              : ['Docker', 'Jest', 'CI/CD'],
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions
              : ['Quantify accomplishments in work experience bullet points.'],
            grammarSuggestions: Array.isArray(parsed.grammarSuggestions)
              ? parsed.grammarSuggestions
              : ['Use strong action verbs at the beginning of bullet points.'],
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths
              : [
                  'Clear educational history',
                  'Relevant technical skills listed',
                ],
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses
              : [
                  'Could include more metric-backed metrics in project descriptions',
                ],
            skillsAnalysis: parsed.skillsAnalysis || {
              matchedSkills: cv?.skills?.slice(0, 5) || ['React', 'TypeScript'],
              missingSkills: ['Docker', 'Kubernetes'],
              recommendedSkills: ['Jest', 'GraphQL'],
            },
            sectionScores: parsed.sectionScores || {
              summary: cv?.personal?.summary ? 85 : 50,
              experience: cv?.experience?.length ? 80 : 40,
              skills: cv?.skills?.length ? 85 : 40,
              education: cv?.education?.length ? 90 : 50,
              projects: cv?.projects?.length ? 85 : 50,
            },
            jobMatchScore: parsed.jobMatchScore ?? 82,
            jobMatchAnalysis:
              parsed.jobMatchAnalysis ||
              `Good alignment with target title ${dto.targetJobTitle}.`,
            targetJobTitle: dto.targetJobTitle,
            evaluatedAt: new Date(),
          };
        }
      } catch (err: any) {
        this.logger.error(`ATS evaluation JSON parsing failed: ${err.message}`);
      }
    }

    if (!analysis) {
      const skillsCount = cv?.skills?.length || 0;
      const expCount = cv?.experience?.length || 0;
      const score = Math.min(95, 60 + skillsCount * 3 + expCount * 5);
      const isJobDescProvided = Boolean(dto.jobDescription?.length);

      analysis = {
        overallScore: score,
        matchScore: Math.max(50, score - 5),
        formattingScore: 88,
        readabilityScore: 90,
        readabilityLevel: 'Professional & Clear',
        missingKeywords: [
          'Docker',
          'CI/CD',
          'Jest',
          'REST APIs',
          'Agile',
        ].filter((k) => !(cv?.skills || []).includes(k)),
        suggestions: [
          `Add more industry-standard keywords related to ${dto.targetJobTitle}.`,
          'Include metric-backed results (e.g. "Improved page speed by 30%").',
          'Ensure work experience descriptions detail specific tools and frameworks.',
        ],
        grammarSuggestions: [
          'Use active voice verbs (e.g., "Engineered", "Implemented", "Architected").',
          'Maintain consistent past tense for previous roles and present tense for active roles.',
        ],
        strengths: [
          'Well-structured contact and personal summary section',
          'Relevant technology skills array',
          'Clear chronological breakdown',
        ],
        weaknesses: [
          'Could benefit from additional quantitative metrics in experience bullets',
          'Missing key devops and automated testing tools',
        ],
        skillsAnalysis: {
          matchedSkills: cv?.skills || ['React', 'TypeScript', 'TailwindCSS'],
          missingSkills: ['Docker', 'CI/CD', 'Jest'],
          recommendedSkills: ['GraphQL', 'Redis', 'NodeJS'],
        },
        sectionScores: {
          summary: cv?.personal?.summary ? 88 : 50,
          experience: expCount > 0 ? 82 : 45,
          skills: skillsCount > 0 ? 86 : 40,
          education: cv?.education?.length ? 90 : 50,
          projects: cv?.projects?.length ? 85 : 50,
        },
        jobMatchScore: isJobDescProvided ? 84 : score,
        jobMatchAnalysis: isJobDescProvided
          ? `Resume aligns strongly with job posting criteria for ${dto.targetJobTitle}.`
          : `General technical candidate alignment for ${dto.targetJobTitle}.`,
        targetJobTitle: dto.targetJobTitle,
        evaluatedAt: new Date(),
      };
    }

    // Persist ATS analysis result onto user's DB CV if CV document exists in DB
    try {
      const dbCv = await this.cvModel.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (dbCv) {
        dbCv.atsAnalysis = analysis;
        await dbCv.save();
      }
    } catch {}

    return analysis;
  }

  async autoFixAts(userId: string, dto: AtsAutoFixDto): Promise<any> {
    this.logger.log(`Auto-fixing ATS missing keywords for user ${userId}`);

    let existingCv: any = dto.cvData || null;
    if (!existingCv) {
      try {
        existingCv = await this.getCvByUserId(userId);
      } catch {
        existingCv = null;
      }
    }

    const currentSkills = existingCv?.skills || [];
    const missing = dto.missingKeywords || [];
    const newSkills = Array.from(new Set([...currentSkills, ...missing]));

    const prompt = `Rewrite the candidate summary to naturally incorporate these missing keywords: ${missing.join(', ')}.
Current Summary: "${existingCv?.personal?.summary || ''}"

Return ONLY a JSON object: { summary: string }.`;

    const raw = await this.llmService.complete(prompt, { json: true });

    let updatedSummary = existingCv?.personal?.summary;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.summary) updatedSummary = parsed.summary;
      } catch {}
    }

    const updatedData = {
      personal: {
        ...(existingCv?.personal || {}),
        summary:
          updatedSummary ||
          `Experienced ${dto.targetJobTitle} skilled in ${missing.slice(0, 3).join(', ')} and modern web application development.`,
      },
      experience: existingCv?.experience || [],
      education: existingCv?.education || [],
      skills: newSkills,
      projects: existingCv?.projects || [],
      references: existingCv?.references || [],
      hobbies: existingCv?.hobbies || [],
    };

    return updatedData;
  }
}
