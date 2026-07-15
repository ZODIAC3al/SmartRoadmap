import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheatSheet } from '../../schemas/cheat-sheet.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { AiProviderFactory } from '../../ai/ai-provider.factory';

@Injectable()
export class CheatSheetService {
  private readonly logger = new Logger(CheatSheetService.name);

  constructor(
    @InjectModel(CheatSheet.name)
    private readonly cheatSheetModel: Model<CheatSheet>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(QuizSession.name)
    private readonly quizSessionModel: Model<QuizSession>,
    private readonly aiProviderFactory: AiProviderFactory,
  ) {}

  async get(userId: string, moduleId: string): Promise<CheatSheet | null> {
    return this.cheatSheetModel.findOne({
      userId: new Types.ObjectId(userId),
      moduleId,
    }).exec();
  }

  async generate(userId: string, moduleId: string): Promise<CheatSheet> {
    const roadmap = await this.roadmapModel.findOne({ userId: new Types.ObjectId(userId), status: 'active' });
    if (!roadmap) throw new NotFoundException('Active roadmap not found');

    const module = roadmap.modules.find((m) => m.id === moduleId);
    if (!module) throw new NotFoundException('Roadmap module not found');

    // Fetch user's latest quiz session for this module to find missed questions
    const latestQuiz = await this.quizSessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        moduleId,
        status: 'completed',
      })
      .sort({ createdAt: -1 })
      .exec();

    const missedTopics: string[] = [];
    if (latestQuiz && latestQuiz.answers) {
      latestQuiz.answers.forEach((ans) => {
        if (!ans.correct) {
          missedTopics.push(ans.question);
        }
      });
    }

    const prompt = `
Create a comprehensive, 1-page cheatsheet Reference Guide for the learning module:
Module Title: "${module.title}"
Module Description: "${module.description || ''}"
Key Topics covered: ${module.topics.join(', ')}

${missedTopics.length > 0 ? `The learner struggled with these specific quiz questions recently, so please address/clarify these concepts with high importance:\n- ${missedTopics.join('\n- ')}` : ''}

Provide a clean Markdown output containing:
1. **Key Concepts & Definitions**
2. **Core Formulas or Code Snippets** (where applicable, else practical examples)
3. **Common Pitfalls & How to Avoid Them**
4. **Summary & Quick Reference Checklist**

Reply with ONLY the Markdown content. Do not include any HTML or extra meta dialog.
`;

    const system = 'You are an elite educational assistant specializing in creating highly concise study guides.';
    
    // Choose Groq for speed and structured summary, falling back to openai or gemini if key missing
    const provider = this.aiProviderFactory.getProvider('groq');
    
    this.logger.log(`Generating cheat sheet for Module ${moduleId} using AI provider...`);
    const content = await provider.generateText(prompt, system);

    // Rate-limit regeneration count increment
    const existing = await this.get(userId, moduleId);
    const count = existing ? (existing.regeneratedCount || 0) + 1 : 0;

    const saved = await this.cheatSheetModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), moduleId },
      {
        $set: {
          content,
          generatedByProvider: 'groq', // will fallback internally
          regeneratedCount: count,
        },
      },
      { upsert: true, new: true },
    );

    return saved;
  }
}
