import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async get(userId: string, moduleId: string): Promise<CheatSheet | null> {
    return this.cheatSheetModel.findOne({
      userId: new Types.ObjectId(userId),
      moduleId,
    }).exec();
  }

  async getHistory(userId: string, moduleId: string) {
    const sheet = await this.get(userId, moduleId);
    if (!sheet) return [];
    return (sheet.versions || []).slice().reverse(); // newest first
  }

  async generate(userId: string, moduleId: string): Promise<CheatSheet> {
    return this._generateInternal(userId, moduleId, false);
  }

  async regenerate(userId: string, moduleId: string): Promise<CheatSheet> {
    return this._generateInternal(userId, moduleId, true);
  }

  private async _generateInternal(
    userId: string,
    moduleId: string,
    isRegen: boolean,
  ): Promise<CheatSheet> {
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!roadmap) throw new NotFoundException('Active roadmap not found');

    const module = roadmap.modules.find((m) => m.id === moduleId);
    if (!module) throw new NotFoundException('Roadmap module not found');

    // Fetch user's latest quiz session for missed topics
    const latestQuiz = await this.quizSessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        moduleId,
        status: 'completed',
      })
      .sort({ createdAt: -1 })
      .exec();

    const missedTopics: string[] = [];
    if (latestQuiz?.answers) {
      latestQuiz.answers.forEach((ans) => {
        if (!ans.correct) missedTopics.push(ans.question);
      });
    }

    // Use different temperature on regeneration for variety
    const regenNote = isRegen
      ? 'NOTE: This is a REGENERATION request — please vary the structure, examples, and wording significantly from the previous version to offer a fresh perspective.\n'
      : '';

    const prompt = `
${regenNote}Create a comprehensive, 1-page AI Speech Notes guide for the learning module:
Module Title: "${module.title}"
Module Description: "${module.description || ''}"
Key Topics covered: ${module.topics.join(', ')}

${missedTopics.length > 0 ? `The learner struggled with these specific quiz questions recently, so please address and clarify these concepts with high importance:\n- ${missedTopics.join('\n- ')}` : ''}

Provide clean Markdown output containing:
1. **Key Concepts & Definitions**
2. **Core Formulas or Code Snippets** (where applicable, else practical examples)
3. **Common Pitfalls & How to Avoid Them**
4. **Summary & Quick Reference Checklist**

Reply with ONLY the Markdown content. Do not include any HTML or extra meta dialog.
`;

    const system = 'You are an elite educational assistant specializing in creating highly concise, practical study guides for software engineers.';

    const provider = this.aiProviderFactory.getProvider('groq');
    this.logger.log(`${isRegen ? 'Regenerating' : 'Generating'} speech notes for Module ${moduleId}...`);
    const content = await provider.generateText(prompt, system);

    const existing = await this.get(userId, moduleId);

    let versionsUpdate = {};
    if (existing?.content) {
      // Push the CURRENT content to history before overwriting
      versionsUpdate = {
        $push: {
          versions: {
            $each: [
              {
                content: existing.content,
                generatedByProvider: existing.generatedByProvider,
                generatedAt: new Date(),
              },
            ],
            $slice: -10, // keep last 10 versions max
          },
        },
      };
    }

    const count = existing ? (existing.regeneratedCount || 0) + (isRegen ? 1 : 0) : 0;

    const saved = await this.cheatSheetModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), moduleId },
      {
        $set: {
          content,
          generatedByProvider: 'groq',
          regeneratedCount: count,
        },
        ...versionsUpdate,
      },
      { upsert: true, new: true },
    );

    // Emit events for achievement tracking
    if (isRegen) {
      this.eventEmitter.emit('cheatsheet.regenerated', { userId });
    }

    return saved;
  }
}
