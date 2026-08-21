import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession } from '../../schemas/chat-session.schema';
import { RoadmapService } from '../roadmap/roadmap.service';
import { AdminService } from '../admin/admin.service';
import { GeminiLLMProvider } from '../../ai/gemini-llm.provider';
import { ChatMessage } from '../../ai/llm-provider.interface';
import { ConfigService } from '@nestjs/config';
import { ScopeClassifierService } from './scope-classifier.service';
import { RAGService } from '../../ai/rag.service';

export type ChatIntent =
  | {
      type: 'database';
      tool:
        | 'getTotalUsers'
        | 'getAllUsers'
        | 'getTotalCourses'
        | 'getTotalLectures'
        | 'getUsersByRole';
      params?: { role?: string };
    }
  | {
      type: 'course';
      domain: 'resources' | 'jobs';
      strategy: 'sentence_window' | 'auto_merging';
    }
  | { type: 'general' };

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
    private readonly scopeClassifier: ScopeClassifierService,
    private readonly ragService: RAGService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const modelName =
      this.config.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';
    if (apiKey) {
      this.llmProvider = new GeminiLLMProvider(apiKey, modelName);
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

  /** Step 3: Intent Classifier */
  private classifyIntent(
    messageText: string,
    scopeCategory?: string,
  ): ChatIntent {
    const text = messageText.toLowerCase().trim();

    // Database intent patterns (strict tool mapping)
    if (
      /how many users|user count|total users|number of users|registered users|عدد المستخدمين|كم عدد المستخدمين|كم مستخدم/i.test(
        text,
      )
    ) {
      return { type: 'database', tool: 'getTotalUsers' };
    }

    if (
      /get all users|show me users|show me the users|list all users|all users|عرض جميع المستخدمين|جميع المستخدمين/i.test(
        text,
      )
    ) {
      return { type: 'database', tool: 'getAllUsers' };
    }

    if (
      /how many learners|learner count|total learners|learners registered|عدد المتعلمين|كم متعلم/i.test(
        text,
      )
    ) {
      return {
        type: 'database',
        tool: 'getUsersByRole',
        params: { role: 'learner' },
      };
    }

    if (
      /how many mentors|mentor count|total mentors|mentors there|عدد الموجهين|كم موجه/i.test(
        text,
      )
    ) {
      return {
        type: 'database',
        tool: 'getUsersByRole',
        params: { role: 'mentor' },
      };
    }

    if (
      /how many courses|course count|total courses|how many tracks|عدد الدورات|عدد المسارات|كم دورة/i.test(
        text,
      )
    ) {
      return { type: 'database', tool: 'getTotalCourses' };
    }

    if (
      /how many lectures|lecture count|total lectures|number of lectures|how many modules|عدد المحاضرات|كم محاضرة/i.test(
        text,
      )
    ) {
      return { type: 'database', tool: 'getTotalLectures' };
    }

    if (/audit|log|analytics|stat|system metrics/i.test(text)) {
      return { type: 'database', tool: 'getTotalUsers' };
    }

    // Course / RAG intent patterns
    if (
      scopeCategory === 'course' ||
      scopeCategory === 'project' ||
      scopeCategory === 'career' ||
      /course|lesson|module|roadmap|guide|tutorial|cheatsheet|job|career|project|documentation|explain|debug|how to/i.test(
        text,
      )
    ) {
      const domain = scopeCategory === 'career' ? 'jobs' : 'resources';
      const strategy =
        scopeCategory === 'course' ||
        scopeCategory === 'project' ||
        scopeCategory === 'career'
          ? 'auto_merging'
          : 'sentence_window';
      return { type: 'course', domain, strategy };
    }

    // General intent
    return { type: 'general' };
  }

  /**
   * Main Chatbot Pipeline
   * Order:
   * 1. Scope Validation
   * 2. Authorization Check
   * 3. Intent Classification
   * 4. Route to Correct Handler (General -> Gemini, Course -> RAG, Database -> DB Tool)
   */
  async handleMessage(
    userId: string,
    userRole: string,
    messageText: string,
  ): Promise<string> {
    const session = await this.getSession(userId);
    session.messages.push({
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    });
    await session.save();

    // ──────── STEP 1: SCOPE VALIDATION ────────
    const scope = this.scopeClassifier.classify(messageText);
    if (!scope.allowed) {
      const rejectionMsg =
        scope.reason ||
        'I am Study Buddy! Please ask a question related to your SmartRoadmap learning path, programming concepts, or career skills.';
      session.messages.push({
        role: 'model',
        content: rejectionMsg,
        createdAt: new Date(),
      });
      await session.save();
      return rejectionMsg;
    }

    // ──────── STEP 3: QUESTION / INTENT CLASSIFICATION ────────
    const intent = this.classifyIntent(messageText, scope.topicCategory);

    // ──────── STEP 2: AUTHORIZATION CHECK ────────
    if (intent.type === 'database') {
      if (userRole !== 'admin') {
        const authErrorMsg =
          "You don't have permission to access administrative statistics.";
        session.messages.push({
          role: 'model',
          content: authErrorMsg,
          createdAt: new Date(),
        });
        await session.save();
        return authErrorMsg;
      }
    }

    // ──────── STEP 4: ROUTE TO HANDLER ────────
    let contextStr = '';

    if (intent.type === 'database') {
      // Handler: Safe Predefined Database Tool / Backend Service
      let dbDataText = '';

      switch (intent.tool) {
        case 'getTotalUsers': {
          const total = await this.adminService.getTotalUsers();
          dbDataText = `Total Registered Users in MongoDB: ${total}`;
          break;
        }
        case 'getAllUsers': {
          const users = await this.adminService.getAllUsers(20);
          const userLines = users
            .map(
              (u) => `- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`,
            )
            .join('\n');
          dbDataText = `Database Users List (Top 20 from MongoDB):\n${userLines || 'No users found'}`;
          break;
        }
        case 'getUsersByRole': {
          const role = intent.params?.role || 'learner';
          const count = await this.adminService.getUsersByRole(role);
          dbDataText = `Total ${role}s registered in MongoDB: ${count}`;
          break;
        }
        case 'getTotalCourses': {
          const totalCourses = await this.adminService.getTotalCourses();
          dbDataText = `Total Courses / Tracks in MongoDB: ${totalCourses}`;
          break;
        }
        case 'getTotalLectures': {
          const totalLectures = await this.adminService.getTotalLectures();
          dbDataText = `Total Lectures / Modules in MongoDB: ${totalLectures}`;
          break;
        }
      }

      contextStr += `\n[Database Tool Grounded Data (Real MongoDB Result)]\n${dbDataText}\n`;
    } else if (intent.type === 'course') {
      // Handler: RAG Retrieval
      try {
        const { formattedContext } = await this.ragService.retrieveContext({
          domain: intent.domain,
          query: messageText,
          strategy: intent.strategy,
          limit: 4,
        });
        contextStr += formattedContext;
      } catch (err: any) {
        this.logger.debug(`RAG retrieval skipped or failed: ${err.message}`);
      }

      // Append active roadmap context if user asks about learning
      try {
        const roadmap = await this.roadmapService.getActiveRoadmap(userId);
        if (roadmap?.modules) {
          const activeModules = roadmap.modules.filter(
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
      } catch {
        // optional context
      }
    } else {
      // Handler: General Question (Direct Gemini LLM)
      // No DB query, no RAG query executed.
    }

    // Build System Prompt
    const systemPrompt = `You are "Study Buddy", a highly knowledgeable, helpful AI study buddy coding assistant for SmartRoadmap.
    User Role: ${userRole}.
    ${contextStr ? `Current Context Info:\n${contextStr}` : ''}
    Always follow these instructions:
    - If [Database Tool Grounded Data (Real MongoDB Result)] is present in the context, state the exact numbers/information provided from MongoDB. Do NOT invent, hardcode, or simulate numbers.
    - If explaining programming concepts or debugging, provide clear explanations with code examples.
    - Reply in the same language the user writes in (English or Arabic). Make responses engaging, professional, and clear.`;

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...session.messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let responseText = '';

    if (this.llmProvider) {
      try {
        responseText = await this.llmProvider.chat(chatHistory);
      } catch (err: any) {
        this.logger.debug(
          `Gemini API provider chat fallback (${err.message}). Using SmartRoadmap simulation response.`,
        );
        responseText = '';
      }
    }

    // Fallback if LLM provider offline/unreachable
    if (!responseText) {
      const lower = messageText.toLowerCase().trim();
      const isArabic = /[\u0600-\u06FF]/.test(messageText);

      if (intent.type === 'database') {
        if (intent.tool === 'getTotalUsers') {
          const count = await this.adminService.getTotalUsers();
          responseText = isArabic
            ? `يوجد حالياً ${count} مستخدم مسجل في المنصة.`
            : `There are currently ${count} registered users in the app.`;
        } else if (intent.tool === 'getAllUsers') {
          const users = await this.adminService.getAllUsers(10);
          const listStr = users
            .map((u) => `- ${u.name} (${u.email}) [${u.role}]`)
            .join('\n');
          responseText = isArabic
            ? `قائمة المستخدمين المسجلين في المنصة:\n${listStr}`
            : `Registered Users:\n${listStr}`;
        } else if (intent.tool === 'getTotalCourses') {
          const cCount = await this.adminService.getTotalCourses();
          responseText = isArabic
            ? `إجمالي عدد المسارات والدورات المتاحة: ${cCount}.`
            : `Total available courses/tracks: ${cCount}.`;
        } else if (intent.tool === 'getTotalLectures') {
          const lCount = await this.adminService.getTotalLectures();
          responseText = isArabic
            ? `إجمالي عدد المحاضرات والدروس المتاحة: ${lCount}.`
            : `Total available lectures/modules: ${lCount}.`;
        } else if (intent.tool === 'getUsersByRole') {
          const role = intent.params?.role || 'learner';
          const rCount = await this.adminService.getUsersByRole(role);
          responseText = isArabic
            ? `عدد الـ ${role}s المسجلين: ${rCount}.`
            : `Total registered ${role}s: ${rCount}.`;
        }
      } else if (
        lower.includes('hello') ||
        lower.includes('hi') ||
        lower.includes('hey') ||
        lower.includes('مرحبا') ||
        lower.includes('أهلا') ||
        lower.includes('سلام')
      ) {
        responseText = isArabic
          ? `أهلاً وسهلاً بك في SmartRoadmap! 🚀 أنا رفيقك التعليمي الذكي. كيف يمكنني مساعدتك اليوم في مسارك الدراسي أو أسئلتك البرمجية؟`
          : `Hello and welcome to SmartRoadmap! 🚀 I'm your AI Study Buddy. How can I help you today with your learning path, quizzes, or programming questions?`;
      } else {
        responseText = isArabic
          ? `شكراً لاستفسارك! بصفتي رفيقك التعليمي الذكي، يمكنني مساعدتك في شرح المفاهيم البرمجية، مراجعة المشاريع، واستكشاف الأخطاء البرمجية.`
          : `Thanks for reaching out! As your AI Study Buddy, I can help explain programming concepts, debug code snippets, or guide you through your roadmap modules. What topic would you like to explore?`;
      }
    }

    session.messages.push({
      role: 'model',
      content: responseText,
      createdAt: new Date(),
    });
    await session.save();

    return responseText;
  }
}
