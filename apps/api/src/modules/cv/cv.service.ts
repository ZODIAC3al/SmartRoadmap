import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cv } from '../../schemas/cv.schema';
import { LLMService } from '../../ai/llm.service';
import axios from 'axios';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);
  private readonly isMockMode: boolean;

  constructor(
    @InjectModel(Cv.name) private readonly cvModel: Model<Cv>,
    private readonly llmService: LLMService,
  ) {
    const apiKey = process.env.AFFINDA_API_KEY;
    this.isMockMode = !apiKey || apiKey.includes('placeholder');
    if (this.isMockMode) {
      this.logger.warn('Affinda API key is missing. Running in MOCK/OFFLINE mode for CV parsing.');
    }
  }

  async getCvByUserId(userId: string): Promise<Cv> {
    const cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cv) {
      throw new NotFoundException(`No CV found for user: ${userId}`);
    }
    return cv;
  }

  async saveCv(userId: string, data: any): Promise<Cv> {
    this.logger.log(`Saving CV profile for user ${userId}`);
    
    let cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cv) {
      cv = new this.cvModel({
        userId: new Types.ObjectId(userId),
        ...data,
      });
    } else {
      cv.personal = data.personal;
      cv.experience = data.experience || [];
      cv.education = data.education || [];
      cv.skills = data.skills || [];
      cv.projects = data.projects || [];
      cv.fileUrl = data.fileUrl || cv.fileUrl;
    }

    return cv.save();
  }

  async enhanceDescription(text: string): Promise<string> {
    this.logger.log('Enhancing resume bullet point description using AI');
    
    // We construct a specific prompt for resume optimization
    const prompt = `You are a professional resume writer. Rewrite the following description to sound highly impactful, utilizing active verbs and highlighting results: "${text}". Provide ONLY the improved description as output, keep it short and professional (1-2 sentences).`;
    
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0]?.message?.content?.trim() || text;
      } catch (error) {
        this.logger.error('Failed to enhance description with OpenAI. Falling back to mock enhancement.', error);
      }
    }

    // Local simulated rewrite fallback
    return `Designed and deployed highly scalable systems, resulting in a 25% improvement in processing performance: ${text}`;
  }

  async parseCvFile(fileBuffer: Buffer, fileName: string): Promise<any> {
    if (this.isMockMode) {
      this.logger.log(`[Mock] Simulating resume parsing for file: "${fileName}"`);
      // Return a structured mockup resume template
      return {
        personal: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          phone: '+1 555-0199',
          summary: 'Motivated software professional eager to master modern tech stacks. Background in building dynamic web applications.',
        },
        experience: [
          {
            company: 'Vortex Software Systems',
            role: 'Junior Full Stack Developer',
            startDate: '2024-01-01',
            endDate: 'Present',
            description: 'Collaborated on developing React frontends and Node.js APIs. Maintained relational databases and code standards.',
          },
        ],
        education: [
          {
            school: 'Cairo University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            graduateDate: '2023-06-15',
          },
        ],
        skills: ['JavaScript', 'HTML/CSS', 'React', 'Node.js', 'Git'],
        projects: [
          {
            name: 'Personal Portfolio Project',
            description: 'Built a responsive layout highlighting completed modules and code samples.',
            url: 'https://github.com/johndoe/portfolio',
          },
        ],
      };
    }

    try {
      // Send file to Affinda REST endpoint manually to avoid dependency packaging issues
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fileBuffer, { filename: fileName });
      
      const workspaceId = process.env.AFFINDA_WORKSPACE_ID;
      if (workspaceId) {
        form.append('workspace', workspaceId);
      }

      const response = await axios.post('https://api.affinda.com/v3/documents', form, {
        headers: {
          Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      const docMeta = response.data;
      // Affinda resumes parsing mapping structure
      const parsedData = docMeta.data || {};
      
      return {
        personal: {
          name: parsedData.name?.raw || '',
          email: parsedData.emails?.[0] || '',
          phone: parsedData.phones?.[0] || '',
          summary: parsedData.summary || '',
        },
        experience: (parsedData.workExperience || []).map((exp: any) => ({
          company: exp.organization || '',
          role: exp.jobTitle || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          description: exp.jobDescription || '',
        })),
        education: (parsedData.education || []).map((edu: any) => ({
          school: edu.organization || '',
          degree: edu.accreditation?.educationLevel || edu.degree || '',
          fieldOfStudy: edu.accreditation?.educationField || '',
          graduateDate: edu.endDate || '',
        })),
        skills: (parsedData.skills || []).map((sk: any) => sk.name || sk),
        projects: [],
      };
    } catch (error: any) {
      this.logger.error('Failed to parse document via Affinda API. Recovering with mock parser.', error.stack);
      return this.parseCvFile(fileBuffer, fileName); // Return fallback
    }
  }
}
