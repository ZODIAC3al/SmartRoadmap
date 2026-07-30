import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession } from '../../schemas/chat-session.schema';
import { RoadmapService } from '../roadmap/roadmap.service';
import { AdminService } from '../admin/admin.service';
import { GeminiLLMProvider } from '../../ai/gemini-llm.provider';
import { ChatMessage } from '../../ai/llm-provider.interface';
import { ConfigService } from '@nestjs/config';

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
      this.logger.warn('GEMINI_API_KEY is not set. Chatbot will run in simulation mock mode.');
    }
  }

  async getSession(userId: string): Promise<ChatSession> {
    let session = await this.chatSessionModel.findOne({ userId: new Types.ObjectId(userId) });
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
    await this.chatSessionModel.deleteOne({ userId: new Types.ObjectId(userId) });
  }

  async handleMessage(userId: string, userRole: string, messageText: string): Promise<string> {
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
    const askAboutRoadmap = /roadmap|study|learn|step|module|progress/i.test(messageText);
    if (askAboutRoadmap) {
      try {
        const roadmap = await this.roadmapService.getActiveRoadmap(userId);
        if (roadmap) {
          const activeModules = roadmap.modules.filter((m) => m.status === 'in_progress' || m.status === 'failed');
          const modSummary = activeModules.map((m) => `- ${m.title} (Status: ${m.status}, topics: ${m.topics.join(', ')})`).join('\n');
          contextStr += `\n[User Learning Context]\nTarget Career: ${roadmap.targetRole || 'Not set'}\nActive Modules:\n${modSummary || 'None active'}\n`;
        }
      } catch (err) {
        contextStr += `\n[User Learning Context]\nTarget Career: Not set\nActive Modules: None\n`;
      }
    }

    // Check if asking about system diagnostics, admin stats, audit logs, or user roles
    const askAboutAdmin = /audit|log|analytics|stat|users count|system/i.test(messageText);
    if (askAboutAdmin) {
      if (userRole !== 'admin') {
        // Enforce role-based permissions: learners cannot see logs
        const responseText = 'Access Denied: You do not have permissions to access administrative statistics or audit trails.';
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
          const logSummary = logs.slice(0, 5).map((l) => `- [${l.severity.toUpperCase()}] ${l.action}: ${l.details}`).join('\n');
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

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...session.messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let responseText = '';

    // 5. Invoke LLM Provider or run simulation fallback
    if (this.llmProvider) {
      try {
        responseText = await this.llmProvider.chat(chatHistory);
      } catch (err: any) {
        this.logger.error(`Gemini provider chat failed: ${err.message}`);
        responseText = `Error connecting to Gemini LLM: ${err.message}`;
      }
    } else {
      // Simulation / Mock mode response fallback
      if (askAboutAdmin) {
        responseText = `Hello Admin! Here is a simulation review: Platform services are operational, total users count is 142.`;
      } else if (askAboutRoadmap) {
        responseText = `Hi there! It looks like you're studying your customized modules. Let me know if you need help with React, NodeJS, or DevOps configuration files!`;
      } else {
        responseText = `I am currently running in mock simulation mode. Please configure GEMINI_API_KEY in your .env file to enable dynamic AI chatbot replies.`;
      }
    }

    // 6. Save assistant response to database session
    session.messages.push({
      role: 'model',
      content: responseText,
      createdAt: new Date(),
    });
    await session.save();

    return responseText;
  }
}
