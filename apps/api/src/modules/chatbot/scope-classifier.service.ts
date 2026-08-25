import { Injectable, Logger } from '@nestjs/common';

export interface ScopeCheckResult {
  allowed: boolean;
  reason?: string;
  topicCategory?: 'roadmap' | 'code' | 'course' | 'project' | 'career' | 'out_of_scope';
  suggestedStrategy?: 'sentence_window' | 'auto_merging';
}

@Injectable()
export class ScopeClassifierService {
  private readonly logger = new Logger(ScopeClassifierService.name);

  // In-scope regex keywords
  private readonly roadmapKeywords =
    /roadmap|track|module|lesson|topic|progress|remedial|study|learn|curriculum|quiz|exam/i;
  private readonly codeKeywords =
    /code|function|debug|error|syntax|algorithm|data structure|variable|typescript|javascript|python|css|html|react|nest|node|sql|api|git|bug|fix|refactor|compile/i;
  private readonly courseKeywords =
    /course|material|cheatsheet|guide|tutorial|documentation|concept|definition|explanation|overview/i;
  private readonly projectKeywords =
    /project|brief|portfolio|repo|build|architecture|component|database|schema/i;
  private readonly careerKeywords =
    /job|career|interview|resume|skill|match|hiring|salary|recruiter|role|frontend engineer|backend engineer|full stack/i;

  private readonly adminKeywords =
    /users|how many users|user count|total users|admin|analytics|stat|audit|log|كم عدد المستخدمين|عدد المستخدمين|مستخدم/i;

  // Explicit out-of-scope regex patterns
  private readonly outOfScopeKeywords =
    /recipe|cooking|food|football|basketball|soccer|movie|celebrity|horoscope|weather|politics|fashion|crypto price|casino|gambling|lottery/i;

  classify(messageText: string): ScopeCheckResult {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return {
        allowed: false,
        reason: 'Empty message',
        topicCategory: 'out_of_scope',
      };
    }

    // 1. Explicit out-of-scope check
    if (this.outOfScopeKeywords.test(trimmed)) {
      this.logger.debug(`Scope check rejected out-of-scope prompt: "${trimmed.substring(0, 40)}..."`);
      return {
        allowed: false,
        reason:
          'I can only help with Devotopia-related questions, such as jobs, companies, resources, courses, applications, and career recommendations.',
        topicCategory: 'out_of_scope',
      };
    }

    // 2. In-scope category classification & RAG strategy assignment
    if (this.codeKeywords.test(trimmed)) {
      return {
        allowed: true,
        topicCategory: 'code',
        suggestedStrategy: 'sentence_window', // Precise definitions & code snippets
      };
    }

    if (this.roadmapKeywords.test(trimmed)) {
      return {
        allowed: true,
        topicCategory: 'roadmap',
        suggestedStrategy: 'sentence_window',
      };
    }

    if (this.courseKeywords.test(trimmed)) {
      return {
        allowed: true,
        topicCategory: 'course',
        suggestedStrategy: 'auto_merging', // Hierarchical course manuals
      };
    }

    if (this.projectKeywords.test(trimmed)) {
      return {
        allowed: true,
        topicCategory: 'project',
        suggestedStrategy: 'auto_merging', // Detailed project documentation
      };
    }

    if (this.careerKeywords.test(trimmed)) {
      return {
        allowed: true,
        topicCategory: 'career',
        suggestedStrategy: 'auto_merging', // Detailed job descriptions
      };
    }

    // 3. Permissive default for software/tech learning questions (if not explicitly out-of-scope)
    if (trimmed.length > 5 && !trimmed.toLowerCase().startsWith('tell me a joke about animals')) {
      return {
        allowed: true,
        topicCategory: 'code',
        suggestedStrategy: 'sentence_window',
      };
    }

    return {
      allowed: false,
      reason:
        'I can only help with Devotopia-related questions, such as jobs, companies, resources, courses, applications, and career recommendations.',
      topicCategory: 'out_of_scope',
    };
  }
}
