import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from './llm.service';

@Injectable()
export class RAGEvalService {
  private readonly logger = new Logger(RAGEvalService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Computes the RAG Triad metrics using the LLM as a judge.
   * Returns a score between 0.0 and 1.0 for each metric.
   */
  async evaluateResponse(query: string, context: string, answer: string) {
    this.logger.log(`Evaluating RAG response for query: "${query}"`);
    try {
      const [contextRelevance, groundedness, answerRelevance] = await Promise.all([
        this.computeContextRelevance(query, context),
        this.computeGroundedness(context, answer),
        this.computeAnswerRelevance(query, answer),
      ]);

      return {
        contextRelevance,
        groundedness,
        answerRelevance,
      };
    } catch (err: any) {
      this.logger.error(`RAG Evaluation failed: ${err.message}`);
      return { contextRelevance: 0, groundedness: 0, answerRelevance: 0 };
    }
  }

  private async computeContextRelevance(query: string, context: string): Promise<number> {
    const prompt = `
      You are an expert evaluator. Evaluate the relevance of the following context to the user's query.
      Does the context contain the information necessary to answer the query?
      
      Query: ${query}
      Context: ${context}
      
      Score 1.0 if highly relevant and sufficient, 0.5 if partially relevant, and 0.0 if completely irrelevant.
      Return ONLY the numeric score (e.g., 1.0) and nothing else.
    `;
    return this.getScoreFromLLM(prompt);
  }

  private async computeGroundedness(context: string, answer: string): Promise<number> {
    const prompt = `
      You are an expert evaluator. Evaluate if the following answer is fully grounded in the provided context.
      Are there any claims or facts in the answer that are not explicitly stated in the context (hallucinations)?
      
      Context: ${context}
      Answer: ${answer}
      
      Score 1.0 if fully grounded (no outside facts), 0.5 if partially grounded, and 0.0 if not grounded at all.
      Return ONLY the numeric score (e.g., 1.0) and nothing else.
    `;
    return this.getScoreFromLLM(prompt);
  }

  private async computeAnswerRelevance(query: string, answer: string): Promise<number> {
    const prompt = `
      You are an expert evaluator. Evaluate how well the answer directly addresses the user's query.
      Does the answer directly answer the question asked?
      
      Query: ${query}
      Answer: ${answer}
      
      Score 1.0 if directly and fully answers the query, 0.5 if it partially answers, and 0.0 if it doesn't answer it.
      Return ONLY the numeric score (e.g., 1.0) and nothing else.
    `;
    return this.getScoreFromLLM(prompt);
  }

  private async getScoreFromLLM(prompt: string): Promise<number> {
    try {
      const response = await this.llmService.complete(prompt, {
        system: 'You are an evaluator. Return ONLY a number between 0.0 and 1.0.',
      });
      if (!response) return 0.0;
      
      // Extract numeric value from response
      const match = response.match(/[0-9]*\.[0-9]+/);
      if (match) {
        return parseFloat(match[0]);
      }
      return 0.0;
    } catch (err: any) {
      this.logger.error(`Failed to get score from LLM: ${err.message}`);
      return 0.0;
    }
  }
}
