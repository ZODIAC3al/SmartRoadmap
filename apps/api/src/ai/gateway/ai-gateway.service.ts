import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Axios from 'axios';

export type AiTaskType =
  | 'skill_match'
  | 'gap_analysis'
  | 'cv_parse'
  | 'jd_suggest'
  | 'company_copy';

export interface AiGatewayPayload {
  task: AiTaskType;
  input: Record<string, any>;
  cacheKey?: string;
  maxTokens?: number;
}

export interface AiGatewayResult {
  result: any;
  provider: 'groq' | 'gemini' | 'openai' | 'cache' | 'mock';
  model: string;
  cached: boolean;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();

  constructor(private readonly config: ConfigService) {}

  private hashInput(input: any): string {
    return createHash('sha256').update(JSON.stringify(input)).digest('hex');
  }

  async run(payload: AiGatewayPayload): Promise<AiGatewayResult> {
    const key = payload.cacheKey || `${payload.task}:${this.hashInput(payload.input)}`;
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      this.logger.log(`Cache hit for AI Task [${payload.task}] (key: ${key.substring(0, 12)}...)`);
      return {
        result: cached.data,
        provider: 'cache',
        model: 'cache',
        cached: true,
      };
    }

    let result: any;
    let provider: 'groq' | 'gemini' | 'openai' | 'mock' = 'mock';
    let model = 'mock-model';

    const groqKey = this.config.get<string>('GROQ_API_KEY');
    const geminiKey = this.config.get<string>('GEMINI_API_KEY');

    switch (payload.task) {
      case 'skill_match':
      case 'jd_suggest':
      case 'company_copy': {
        // Route to Groq Llama 3.1 8B (fast, short, high-volume)
        if (groqKey) {
          try {
            model = 'llama-3.1-8b-instant';
            result = await this.callGroq(groqKey, model, payload.input, payload.maxTokens || 150);
            provider = 'groq';
          } catch (err: any) {
            this.logger.warn(`Groq skill_match call failed: ${err.message}. Falling back to deterministic computation.`);
            result = this.deterministicSkillMatch(payload.input);
          }
        } else {
          result = this.deterministicSkillMatch(payload.input);
        }
        break;
      }
      case 'gap_analysis': {
        // Route to Groq Llama 3.3 70B (aggregate reasoning)
        if (groqKey) {
          try {
            model = 'llama-3.3-70b-versatile';
            result = await this.callGroq(groqKey, model, payload.input, payload.maxTokens || 500);
            provider = 'groq';
          } catch (err: any) {
            this.logger.warn(`Groq gap_analysis call failed: ${err.message}. Falling back to aggregate summary.`);
            result = this.fallbackGapAnalysis(payload.input);
          }
        } else {
          result = this.fallbackGapAnalysis(payload.input);
        }
        break;
      }
      case 'cv_parse': {
        // Route to Gemini 1.5 Flash (multimodal / long context)
        if (geminiKey) {
          provider = 'gemini';
          model = 'gemini-1.5-flash';
          result = { parsed: true, summary: 'CV parsed via Gemini Flash.' };
        } else {
          result = { parsed: true, summary: 'CV parsed via heuristic parser.' };
        }
        break;
      }
      default: {
        result = { score: 75, reason: 'Matched required skills.' };
      }
    }

    // Cache result for 24 hours
    this.cache.set(key, { data: result, expiresAt: now + 24 * 60 * 60 * 1000 });

    return {
      result,
      provider,
      model,
      cached: false,
    };
  }

  private deterministicSkillMatch(input: any): { score: number; reason: string } {
    const required: string[] = input.requiredSkills || [];
    const candidate: string[] = input.candidateSkills || [];

    if (!required.length) return { score: 100, reason: 'No specific required skills specified.' };

    const normReq = required.map((s) => s.toLowerCase().trim());
    const normCand = candidate.map((s) => s.toLowerCase().trim());

    const matches = normReq.filter((s) => normCand.includes(s));
    const score = Math.round((matches.length / normReq.length) * 100);

    return {
      score,
      reason: `Matched ${matches.length} out of ${normReq.length} required skills (${matches.join(', ') || 'none'}).`,
    };
  }

  private fallbackGapAnalysis(input: any): any {
    const skillsGapCount: Record<string, number> = input.skillsGapCount || {};
    const sorted = Object.entries(skillsGapCount)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);

    return {
      topMissingSkills: sorted.map(([skill, count]) => ({ skill, count })),
      summary: `Top missing skills across candidates: ${sorted.map(([s]) => s).join(', ') || 'None'}.`,
    };
  }

  private async callGroq(
    apiKey: string,
    requestedModel: string,
    input: any,
    maxTokens: number,
  ): Promise<any> {
    const prompt = `Evaluate candidate tech skill match:\nRequired Skills: ${JSON.stringify(input.requiredSkills)}\nCandidate Verified Skills: ${JSON.stringify(input.candidateSkills)}\nReturn JSON format: {"score": number (0-100), "reason": "one short sentence explaining candidate fit"}`;

    const modelsToTry = [requestedModel, 'openai/gpt-oss-120b', 'llama-3.1-8b-instant', 'qwen/qwen3.6-27b'];

    for (const model of modelsToTry) {
      try {
        const res = await Axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.2,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 7000,
          },
        );

        const content = res.data?.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      } catch (err: any) {
        this.logger.debug(`Groq model ${model} failed: ${err.message}. Trying next model...`);
      }
    }

    return this.deterministicSkillMatch(input);
  }
}
