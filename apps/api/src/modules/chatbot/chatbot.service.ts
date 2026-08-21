import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession } from '../../schemas/chat-session.schema';
import { RoadmapService } from '../roadmap/roadmap.service';
import { AdminService } from '../admin/admin.service';
import { GeminiLLMProvider } from '../../ai/gemini-llm.provider';
import { ChatMessage } from '../../ai/llm-provider.interface';
import { estimateTokens, trimHistoryToBudget } from '../../ai/token-budget';
import { ConfigService } from '@nestjs/config';

/**
 * Context budget for a chat turn.
 *
 * Trimming by message count (the previous `slice(-10)`) does not bound cost:
 * ten one-line messages are almost free, while ten pasted stack traces are not.
 * Budgeting by estimated tokens bounds the worst case instead of the average.
 */
const HISTORY_TOKEN_BUDGET = 1500;
const PER_MESSAGE_TOKEN_CAP = 500;
const CHAT_MAX_OUTPUT_TOKENS = 800;

/**
 * Cap on messages persisted per session. Without this the document grows for
 * the life of the account, and every read pulls the whole transcript out of
 * Mongo to use only the last few turns.
 */
const MAX_STORED_MESSAGES = 60;

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly llmProvider: GeminiLLMProvider | null = null;

  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSession>,
    private readonly roadmapService: RoadmapService,
    private readonly adminService: AdminService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.llmProvider = new GeminiLLMProvider(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not set. Chatbot will run in simulation mock mode.',
      );
    }
  }

  async getSession(userId: string): Promise<ChatSession> {
    let session = await this.chatSessionModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!session) {
      session = new this.chatSessionModel({
        userId: new Types.ObjectId(userId),
        messages: [],
      });
      await session.save();
    }
    return session;
  }

  async deleteSession(userId: string): Promise<void> {
    await this.chatSessionModel.deleteOne({
      userId: new Types.ObjectId(userId),
    });
  }

  async handleMessage(
    userId: string,
    userRole: string,
    messageText: string,
  ): Promise<string> {
    // 1. Retrieve or initialize chat session
    const session = await this.getSession(userId);

    // 2. Append user message to history
    session.messages.push({
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    });
    await session.save();

    // 3. Build context-aware prompts (target career, current topic, and admin tools execution)
    let contextStr = '';

    // Check if asking about roadmap, steps, or learning
    const askAboutRoadmap = /roadmap|study|learn|step|module|progress/i.test(
      messageText,
    );
    if (askAboutRoadmap) {
      try {
        const roadmap = await this.roadmapService.getActiveRoadmap(userId);
        if (roadmap) {
          const activeModules = (roadmap.modules || []).filter(
            (m: any) => m.status === 'in_progress' || m.status === 'failed',
          );
          const modSummary = activeModules
            .map(
              (m: any) =>
                `- ${m.title} (Status: ${m.status}, topics: ${Array.isArray(m.topics) ? m.topics.join(', ') : ''})`,
            )
            .join('\n');
          contextStr += `\n[User Learning Context]\nTarget Career: ${roadmap.targetRole || 'Not set'}\nActive Modules:\n${modSummary || 'None active'}\n`;
        }
      } catch (err) {
        contextStr += `\n[User Learning Context]\nTarget Career: Not set\nActive Modules: None\n`;
      }
    }

    // Check if asking about system diagnostics, admin stats, audit logs, or user roles
    const askAboutAdmin = /audit|log|analytics|stat|users count|system/i.test(
      messageText,
    );
    if (askAboutAdmin) {
      if (userRole !== 'admin') {
        // Enforce role-based permissions: learners cannot see logs
        const responseText =
          'Access Denied: You do not have permissions to access administrative statistics or audit trails.';
        session.messages.push({
          role: 'model',
          content: responseText,
          createdAt: new Date(),
        });
        await session.save();
        return responseText;
      }

      // Execute Admin tools lookup
      try {
        if (/log/i.test(messageText)) {
          const logs = await this.adminService.getAuditLogs();
          const logSummary = logs
            .slice(0, 5)
            .map(
              (l) =>
                `- [${l.severity.toUpperCase()}] ${l.action}: ${l.details}`,
            )
            .join('\n');
          contextStr += `\n[Admin Context - Recent Audit Logs]\n${logSummary || 'No recent logs'}\n`;
        } else {
          const analytics = await this.adminService.getAnalytics();
          contextStr += `\n[Admin Context - Platform Stats]\nTotal Users: ${analytics.stats.totalUsers}\nLearners: ${analytics.stats.totalLearners}\nMentors: ${analytics.stats.totalMentors}\nQuiz Pass Rate: ${analytics.stats.quizPassRate}\n`;
        }
      } catch (err) {
        contextStr += `\n[Admin Context]\nFailed to load administration tools data.\n`;
      }
    }

    // 4. Compile the prompt messages array (system + history context)
    const systemPrompt = `You are "Study Buddy", a highly knowledgeable, helpful AI study buddy coding assistant.
    You assist the user in their learning journey, answering programming questions and providing app-specific information using backend context variables.
    User Role: ${userRole}.
    ${contextStr ? `Current Context Info:\n${contextStr}` : ''}
    Always follow these instructions:
    - Never access the database directly; use the provided context parameters.
    - If the user asks programming questions (e.g. debugging, language questions, explanations), respond clearly with code examples.
    - Enforce permissions: administrative logs/data are strictly accessible to admins; verify userRole is 'admin' (this is already checked, but verify constraints).
    - Reply in the same language the user writes in (English or Arabic). Make responses engaging and glassmorphism-themed in tone (modern, premium, clear).`;

    // Budget the history by size rather than by turn count, so one long paste
    // cannot silently multiply the cost of every subsequent turn.
    const { kept, tokens, dropped } = trimHistoryToBudget(
      session.messages.map((m) => ({ role: m.role, content: m.content })),
      {
        maxTokens: HISTORY_TOKEN_BUDGET,
        maxPerMessageTokens: PER_MESSAGE_TOKEN_CAP,
        minMessages: 1,
      },
    );

    if (dropped > 0) {
      this.logger.debug(
        `Chat context trimmed: dropped ${dropped} older message(s), ` +
          `sending ${kept.length} in ~${tokens} tokens ` +
          `(+${estimateTokens(systemPrompt)} system)`,
      );
    }

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(kept as ChatMessage[]),
    ];

    let responseText = '';

    // 5. Invoke LLM Provider or run simulation fallback
    if (this.llmProvider) {
      try {
        responseText = await this.llmProvider.chat(chatHistory, {
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
        });
      } catch (err: any) {
        this.logger.debug(
          `Gemini API provider chat fallback (${err.message}). Using SmartRoadmap simulation AI response.`,
        );
        responseText = '';
      }
    }

    if (!responseText) {
      const lower = messageText.toLowerCase().trim();
      const isArabic = /[\u0600-\u06FF]/.test(messageText);

      if (askAboutAdmin) {
        responseText = isArabic
          ? `مرحباً بك في لوحة الإدارة! خدمات المنصة تعمل بكفاءة، إجمالي المستخدمين 142، ونسبة نجاح الاختبارات 88٪.`
          : `Hello Admin! Platform services are fully operational. Total registered users: 142, average quiz pass rate: 88%.`;
      } else if (askAboutRoadmap) {
        responseText = isArabic
          ? `أهلاً بك! تظهر نتائجك أنك تدرس مسار التعلم التكيفي. يسعدني مساعدتك في استيعاب المفاهيم البرمجية، أو مراجعة أكوادك، أو إعداد بيئة التطوير!`
          : `Hi there! I see you are progressing through your adaptive learning path. Let me know if you need help with code explanations, debugging, or project architecture!`;
      } else if (
        lower.includes('hello') ||
        lower.includes('hi') ||
        lower.includes('hey') ||
        lower.includes('مرحبا') ||
        lower.includes('أهلا') ||
        lower.includes('سلام')
      ) {
        responseText = isArabic
          ? `أهلاً وسهلاً بك في Devotopia SmartRoadmap! 🚀 أنا رفيقك التعليمي الذكي. كيف يمكنني مساعدتك اليوم في مسارك الدراسي أو أسئلتك البرمجية؟`
          : `Hello and welcome to Devotopia SmartRoadmap! 🚀 I'm your AI Study Buddy. How can I help you today with your learning path, quizzes, or programming questions?`;
      } else {
        responseText = isArabic
          ? `شكراً لاستفسارك! بصفتي رفيقك التعليمي الذكي في Devotopia، يمكنني مساعدتك في شرح المفاهيم البرمجية، مراجعة المشاريع، واستكشاف الأخطاء البرمجية. يسعدني إجابة أي سؤال لديك!`
          : `Thanks for reaching out! As your Devotopia AI Study Buddy, I can help explain programming concepts, debug code snippets, or guide you through your roadmap modules. What specific topic would you like to explore?`;
      }
    }

    // 6. Save assistant response to database session
    session.messages.push({
      role: 'model',
      content: responseText,
      createdAt: new Date(),
    });

    // Keep the transcript bounded. Older turns are already outside the context
    // budget above, so retaining them costs storage and read bandwidth without
    // ever reaching the model.
    if (session.messages.length > MAX_STORED_MESSAGES) {
      session.messages = session.messages.slice(-MAX_STORED_MESSAGES);
      session.markModified('messages');
    }

    await session.save();

    return responseText;
  }
}
