import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheatSheet } from '../../schemas/cheat-sheet.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { UserTopicResult } from '../../schemas/user-topic-result.schema';
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
    @InjectModel(UserTopicResult.name)
    private readonly topicResultModel: Model<UserTopicResult>,
    private readonly aiProviderFactory: AiProviderFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async get(userId: string, moduleId: string): Promise<CheatSheet | null> {
    return this.cheatSheetModel
      .findOne({
        userId: new Types.ObjectId(userId),
        moduleId,
      })
      .exec();
  }

  async getHistory(userId: string, moduleId: string) {
    const sheet = await this.get(userId, moduleId);
    if (!sheet) return [];
    return (sheet.versions || []).slice().reverse(); // newest first
  }

  async generate(
    userId: string,
    moduleId: string,
    overrides?: { title?: string; description?: string; topics?: string[] },
  ): Promise<CheatSheet> {
    return this._generateInternal(userId, moduleId, false, overrides);
  }

  async regenerate(
    userId: string,
    moduleId: string,
    overrides?: { title?: string; description?: string; topics?: string[] },
  ): Promise<CheatSheet> {
    return this._generateInternal(userId, moduleId, true, overrides);
  }

  private async _generateInternal(
    userId: string,
    moduleId: string,
    isRegen: boolean,
    overrides?: { title?: string; description?: string; topics?: string[] },
  ): Promise<CheatSheet> {
    const roadmap = await this.roadmapModel.findOne({
      userId: Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : undefined,
      status: 'active',
    });

    let targetModule: any = roadmap?.modules?.find(
      (m) =>
        m.id === moduleId || m.id.endsWith(moduleId) || moduleId.endsWith(m.id),
    );

    if (overrides?.title) {
      targetModule = {
        id: moduleId,
        title: overrides.title,
        description:
          overrides.description ||
          `Comprehensive AI study guide for ${overrides.title}`,
        topics: overrides.topics || [overrides.title],
        difficulty: 'intermediate',
        status: 'in_progress',
      };
    } else if (!targetModule) {
      const trackLookup: Record<
        string,
        { title: string; description: string; topics: string[] }
      > = {
        'web-1': {
          title: 'TypeScript Strict Mode',
          description:
            'Write highly maintainable client-side logic using strict type declarations.',
          topics: ['Types', 'Interfaces', 'Generics', 'Strict Compiler'],
        },
        'web-2': {
          title: 'Semantic HTML5 & CSS Grid',
          description:
            'Build accessible structures (WCAG) and layouts with CSS Grid/Flexbox.',
          topics: [
            'Semantic HTML',
            'Grid Layouts',
            'Flex wrap',
            'Accessibility',
          ],
        },
        'web-3': {
          title: 'Next.js App Router Layouts',
          description:
            'Structure applications with nested pages, dynamic layouts, and loading states.',
          topics: ['RSC', 'Suspense', 'Layout files', 'Server Actions'],
        },
        'web-4': {
          title: 'REST API Design & Guards',
          description:
            'Design endpoints with request validations, error payloads, and route guards.',
          topics: ['Controllers', 'DTOs', 'Guards', 'ValidationPipe'],
        },
        'web-5': {
          title: 'Prisma ORM & PostgreSQL',
          description:
            'Model database systems and deploy relational schemas with PostgreSQL.',
          topics: ['Migrations', 'Relations', 'Querying', 'Prisma Schema'],
        },
        'web-6': {
          title: 'JWT Access/Refresh Tokens',
          description:
            'Implement stateless security via access and refresh token rotations.',
          topics: ['JWT sign', 'Refresh strategy', 'Cookies', 'Auth guards'],
        },
        'web-7': {
          title: 'Service Worker & Offline Cache',
          description:
            'Configure client-side service workers to enable full offline workspace operations.',
          topics: [
            'Workbox',
            'CacheStorage',
            'Offline fallback',
            'PWA manifest',
          ],
        },
        'web-8': {
          title: 'Edge Runtime & Server Actions',
          description:
            'Optimize performance using lightweight Edge compute routes.',
          topics: [
            'Vercel Edge',
            'Middleware',
            'Optimistic updates',
            'Form Actions',
          ],
        },
        'web-9': {
          title: 'GraphQL & Apollo Federation',
          description:
            'Aggregate multi-service backend schemas into a single gateway.',
          topics: [
            'Subgraphs',
            'Supergraph',
            'Resolvers',
            'Queries & Mutations',
          ],
        },
      };

      const known = trackLookup[moduleId];
      if (known) {
        targetModule = {
          id: moduleId,
          ...known,
          difficulty: 'intermediate',
          status: 'in_progress',
        };
      } else {
        targetModule = {
          id: moduleId,
          title: moduleId
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          description: `Comprehensive AI study guide for ${moduleId}`,
          topics: [moduleId],
          difficulty: 'intermediate',
          status: 'in_progress',
        };
      }
    }

    // Fetch user's struggling topic_results per dashboard-gamification skill instruction 6
    const strugglingResults = await this.topicResultModel
      .find({
        userId: Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
        topicId: moduleId,
        failPercentage: { $gt: 0 },
      })
      .exec();

    const strugglingNotes = strugglingResults.map(
      (r) =>
        `Struggling topic area (Fail Rate: ${r.failPercentage}%, Failed Attempts: ${r.failedAttempts}/${r.attempts})`,
    );

    // Fetch user's latest quiz session for missed questions
    const latestQuiz = await this.quizSessionModel
      .findOne({
        userId: Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
        moduleId,
        status: 'completed',
      })
      .sort({ createdAt: -1 })
      .exec();

    const missedTopics: string[] = [...strugglingNotes];
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
${regenNote}Create an EXHAUSTIVE, HIGH-FIDELITY, IN-DEPTH MASTER TECHNICAL STUDY GUIDE & CHEATSHEET designed to help a developer COMPLETELY MASTER this topic:
Module Title: "${targetModule.title}"
Module Description: "${targetModule.description || ''}"
Key Concepts & Topics: ${(targetModule.topics || []).join(', ')}

${missedTopics.length > 0 ? `CRITICAL FOCUS - The learner previously struggled with these specific areas/questions. Address these with extreme clarity and deep technical rigor:\n- ${missedTopics.join('\n- ')}` : ''}

REQUIRED STRUCTURE & COMPREHENSIVE PHASES (Ensure extensive, thorough coverage of each section):

# Phase 1: Architectural Mechanics & Theoretical Foundations
Provide a deep-dive explanation of ${targetModule.title}. Explain WHY it exists, how it fits into modern software engineering, and the core underlying mechanisms.
Use a blockquote section starting with \`> Key Architectural Rule:\` to highlight the single most important rule to remember.

# Phase 2: Execution Flow & Core Principles
Break down step-by-step how ${targetModule.title} operates under the hood. 
Use phase markers like \`**Phase 1:**\`, \`**Phase 2:**\`, \`**Phase 3:**\` to delineate execution stages. Explain data flow, lifecycle events, and state mutations.

# Phase 3: Production Implementation & Code Snippets
Provide complete, non-trivial, production-ready code blocks in fenced code blocks (\`\`\`typescript ... \`\`\` or appropriate language). Include clear inline comments explaining non-obvious logic.

# Phase 4: Enterprise Patterns, Pitfalls & Antipatterns
Detail production best practices vs dangerous antipatterns.
Use a blockquote starting with \`> Critical Production Warning:\` to highlight common edge cases, memory leaks, or security vulnerabilities to avoid.

# Phase 5: Complete Master Reference & Key Terminology
Provide a rapid-fire cheat sheet summary with concise bullet points, key API method signatures, performance complexity, and definitions.

Formatting Guidelines:
- Use Markdown headers (# for Phase titles, ## for Sub-sections).
- Use blockquotes (> quote text) for essential rules and key insights.
- Use fenced code blocks with language tags for all code examples.
- Use bold step/phase markers like **Phase 1: ...** for step-by-step processes.
- Produce a DETAILED, EXTENSIVE, ACADEMIC-QUALITY guide. Do not summarize or cut corners.

Reply with ONLY the raw Markdown content.
`;

    const system =
      'You are a distinguished Principal Software Architect and Master Technical Curriculum Designer. Your sole purpose is to produce comprehensive, ultra-detailed, production-ready study guides that enable engineers to achieve absolute mastery over complex engineering topics.';

    const provider = this.aiProviderFactory.getProvider('groq');
    this.logger.log(
      `${isRegen ? 'Regenerating' : 'Generating'} speech notes for Module ${moduleId}...`,
    );
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

    const count = existing
      ? (existing.regeneratedCount || 0) + (isRegen ? 1 : 0)
      : 0;

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
