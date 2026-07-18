// apps/api/src/modules/interview/interview-engine.ts
import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../../ai/llm.service';
import { Types } from 'mongoose';
import { InterviewConfig } from '../../schemas/interview-session.schema';

const MAX_QUESTIONS = 8; // finite question limit per session

/** Pool of fallback questions per interview type */
const QUESTION_POOLS: Record<string, string[]> = {
  technical: [
    'Explain the difference between synchronous and asynchronous programming.',
    'What is REST? How does it differ from GraphQL?',
    'Describe the SOLID principles and give an example of each.',
    'What is a database index and when would you add one?',
    'Explain the concept of closures in JavaScript.',
    'What is the difference between SQL and NoSQL databases?',
    'How does garbage collection work in modern runtimes?',
    'Describe the MVC architectural pattern and its benefits.',
  ],
  behavioral: [
    'Tell me about a time you had to learn a new technology quickly.',
    'Describe a challenging project you worked on and how you overcame obstacles.',
    'How do you prioritise tasks when working under tight deadlines?',
    'Tell me about a time you disagreed with a team member. How did you resolve it?',
    'Describe a situation where you had to explain a complex concept to a non-technical audience.',
    'How do you handle receiving critical feedback on your work?',
    'Tell me about your most significant professional achievement.',
    'How do you stay up to date with new technologies?',
  ],
  mixed: [
    'Walk me through a project where you solved a difficult technical problem.',
    'How do you approach code reviews — both giving and receiving?',
    'Describe how you would design a URL shortening service.',
    'Tell me about a time you improved performance of an existing system.',
    'What strategies do you use for debugging hard-to-reproduce bugs?',
    'How do you balance technical debt vs. feature velocity?',
    'Describe your experience with CI/CD pipelines.',
    'How do you ensure the quality of your code in a team environment?',
  ],
};

function pickQuestion(pool: string[], usedIndices: Set<number>): { index: number; text: string } | null {
  const available = pool
    .map((text, index) => ({ index, text }))
    .filter(q => !usedIndices.has(q.index));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

@Injectable()
export class InterviewEngine {
  private readonly logger = new Logger(InterviewEngine.name);

  constructor(private readonly llm: LLMService) {}

  /**
   * Generate the first question for a session.
   * Returns { id, text, totalQuestions } so the frontend knows the total count.
   */
  async generateFirstQuestion(
    config: InterviewConfig,
    roadmapId: string,
  ): Promise<{ id: string; text: string; totalQuestions: number }> {
    const pool = QUESTION_POOLS[config.type] ?? QUESTION_POOLS.mixed;
    const usedIndices = new Set<number>();

    // Try LLM first
    try {
      if (!this.llm) throw new Error('no llm');
      const prompt =
        `Generate one ${config.type} interview question for a ${config.difficulty} level candidate` +
        ` focusing on roadmap: "${roadmapId}". Return only the question text, no numbering.`;
      const result = await this.llm.complete(prompt, { system: 'You are a professional technical interviewer.' });
      if (result && result.trim().length > 10) {
        return { id: `q-${Date.now()}-0`, text: result.trim(), totalQuestions: MAX_QUESTIONS };
      }
    } catch (e: any) {
      this.logger.warn(`LLM question generation failed, using pool: ${e.message}`);
    }

    // Fallback: random pool question
    const picked = pickQuestion(pool, usedIndices);
    return {
      id: `q-${Date.now()}-0`,
      text: picked?.text ?? 'Tell me about your background and experience.',
      totalQuestions: MAX_QUESTIONS,
    };
  }

  /**
   * Evaluate an answer and return the next question if the session is not finished.
   * `questionNumber` is 1-based (1 = first question just answered).
   */
  async evaluateAnswer(
    questionId: string,
    questionText: string,
    answer: string,
    config: InterviewConfig,
    questionNumber: number,
    usedTexts: string[],
  ): Promise<{
    score: number;
    feedback: string;
    idealAnswer: string;
    correctness: string;
    improvementTips: string;
    finished: boolean;
    nextQuestion?: { id: string; text: string };
  }> {
    const isFinished = questionNumber >= MAX_QUESTIONS;

    // Build evaluation
    let score = 0;
    let feedback = '';
    let idealAnswer = '';
    let correctness = 'incorrect';
    let improvementTips = '';

    try {
      if (!this.llm) throw new Error('no llm');
      const evalPrompt =
        `Question: "${questionText}"\nCandidate answer: "${answer || '(skipped)'}"\n\n` +
        `Evaluate this answer for a ${config.difficulty} ${config.type} interview.\n` +
        `Return JSON: { "score": <0-10>, "feedback": "<2-3 sentence feedback>", "idealAnswer": "<ideal answer>", "correctness": "<correct|partial|incorrect>", "improvementTips": "<1-2 tips>" }`;
      const result = await this.llm.complete(evalPrompt, { json: true, system: 'You are a professional technical interviewer.' });
      if (!result) throw new Error('Empty LLM response');
      const parsed = JSON.parse(result);
      score = Math.min(10, Math.max(0, Number(parsed.score ?? 5)));
      feedback = parsed.feedback ?? '';
      idealAnswer = parsed.idealAnswer ?? '';
      correctness = parsed.correctness ?? 'incorrect';
      improvementTips = parsed.improvementTips ?? '';
    } catch {
      // Deterministic fallback based on answer length
      if (!answer || answer.trim().length === 0) {
        score = 0;
        feedback = 'Question was skipped.';
        idealAnswer = 'A complete answer would address the key concepts and provide examples.';
        correctness = 'incorrect';
        improvementTips = 'Try to answer the question even if you are not sure.';
      } else if (answer.trim().length < 30) {
        score = 3;
        feedback = 'Your answer was very brief. Try to elaborate with examples and details.';
        idealAnswer = 'A complete answer would address the key concepts and provide examples.';
        correctness = 'partial';
        improvementTips = 'Add more details and examples.';
      } else if (answer.trim().length < 150) {
        score = 6;
        feedback = 'Good start! You covered the basics. Adding more depth and concrete examples would strengthen this.';
        idealAnswer = 'Ideally, you would expand on this with real-world scenarios and edge cases.';
        correctness = 'partial';
        improvementTips = 'Explain edge cases and practical applications.';
      } else {
        score = 8;
        feedback = 'Solid answer with good detail. Well done!';
        idealAnswer = 'Your answer was comprehensive and on the right track.';
        correctness = 'correct';
        improvementTips = 'Keep up the detailed explanations.';
      }
    }

    if (isFinished) {
      return { score, feedback, idealAnswer, correctness, improvementTips, finished: true };
    }

    // Generate next question
    const pool = QUESTION_POOLS[config.type] ?? QUESTION_POOLS.mixed;
    const availablePool = pool.filter(q => !usedTexts.includes(q));
    const nextText =
      availablePool.length > 0
        ? availablePool[Math.floor(Math.random() * availablePool.length)]
        : `Follow-up: Can you expand on what you just described?`;

    return {
      score,
      feedback,
      idealAnswer,
      correctness,
      improvementTips,
      finished: false,
      nextQuestion: {
        id: `q-${Date.now()}-${questionNumber}`,
        text: nextText,
      },
    };
  }

  /** Build final report from all collected answers using Gemini LLM */
  async buildReport(
    sessionId: string,
    userId: string,
    config: InterviewConfig,
    answers: Array<{ questionId: string; questionText: string; answer: string; score: number; feedback: string; idealAnswer: string; correctness?: string; improvementTips?: string }>,
  ) {
    this.logger.log(`Starting LLM report generation for session ${sessionId} with ${answers.length} answers.`);
    const total = answers.length || 1;
    const fallbackOverallScore = Math.round((answers.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / total) * 10) / 10;

    const baseReport = {
      sessionId: new Types.ObjectId(sessionId),
      userId,
      questionFeedback: answers.map(a => ({
        questionId: a.questionId || `q-${Date.now()}`,
        questionText: a.questionText || 'Unknown question',
        answer: a.answer || '',
        score: Number(a.score) || 0,
        feedback: a.feedback || 'No feedback provided.',
        idealAnswer: a.idealAnswer || 'No ideal answer provided.',
        correctness: a.correctness || 'incorrect',
        improvementTips: a.improvementTips || '',
      })),
    };

    if (answers.length === 0) {
       this.logger.log(`Session ${sessionId} has 0 answers, returning empty fallback report.`);
       return {
         ...baseReport,
         overallScore: 0,
         technicalScore: 0,
         problemSolvingScore: 0,
         communicationScore: 0,
         confidenceScore: 0,
         strengths: [],
         weaknesses: ['Did not answer any questions'],
         recommendations: ['Try to answer questions next time.'],
         achievements: [],
         roadmapUpdates: [],
       };
    }

    const transcript = answers.map((a, i) => `Q${i+1}: ${a.questionText}\nCandidate Answer: ${a.answer}\nScore Given: ${a.score}/10`).join('\n\n');

    const prompt = `Analyze this interview transcript for a ${config.difficulty} ${config.type} interview.\n\n${transcript}\n\n` +
      `Generate a structured JSON report with the following fields. Ensure all fields are present:\n` +
      `- overallScore (number 0-10)\n` +
      `- technicalScore (number 0-10)\n` +
      `- problemSolvingScore (number 0-10)\n` +
      `- communicationScore (number 0-10)\n` +
      `- confidenceScore (number 0-10)\n` +
      `- strengths (array of 2-3 short specific strings)\n` +
      `- weaknesses (array of 2-3 short specific strings)\n` +
      `- recommendations (array of 2-3 short specific strings)\n` +
      `- achievements (array of 1-3 short specific strings, e.g. "Excellent clarity")\n` +
      `- roadmapUpdates (array of objects with "message" (string) and "priority" ("high"|"medium"|"low"))`;

    let parsed: any = null;
    let attempts = 0;
    while (attempts < 3 && !parsed) {
      try {
        attempts++;
        this.logger.log(`LLM report request attempt ${attempts} for ${sessionId}`);
        const result = await this.llm.complete(prompt, { json: true, system: 'You are an expert technical interviewer.' });
        if (result) {
          parsed = JSON.parse(result);
          this.logger.log(`LLM successfully generated report for ${sessionId}`);
        }
      } catch (err: any) {
        this.logger.error(`LLM report attempt ${attempts} failed for ${sessionId}: ${err.message}`);
        if (attempts >= 3) break;
      }
    }

    if (parsed) {
      return {
        ...baseReport,
        overallScore: Number(parsed.overallScore) || fallbackOverallScore,
        technicalScore: Number(parsed.technicalScore) || fallbackOverallScore,
        problemSolvingScore: Number(parsed.problemSolvingScore) || fallbackOverallScore,
        communicationScore: Number(parsed.communicationScore) || fallbackOverallScore,
        confidenceScore: Number(parsed.confidenceScore) || fallbackOverallScore,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        roadmapUpdates: Array.isArray(parsed.roadmapUpdates) ? parsed.roadmapUpdates : [],
      };
    }

    // Deterministic fallback if LLM completely fails
    this.logger.warn(`Falling back to deterministic report generation for ${sessionId}`);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    answers.forEach(a => {
      const qText = a.questionText || 'Unknown question';
      const score = Number(a.score) || 0;
      if (score >= 7) strengths.push(qText.slice(0, 60));
      else if (score < 5) weaknesses.push(qText.slice(0, 60));
    });

    return {
      ...baseReport,
      overallScore: fallbackOverallScore,
      technicalScore: config.type !== 'behavioral' ? fallbackOverallScore : 0,
      problemSolvingScore: fallbackOverallScore,
      communicationScore: Math.max(0, Math.min(10, fallbackOverallScore + (Math.random() > 0.5 ? 1 : -1))),
      confidenceScore: answers.filter(a => a.answer && a.answer.length > 50).length / total * 10,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      recommendations: ['Consider practicing more to get a fully AI-generated analysis.'],
      achievements: fallbackOverallScore >= 8 ? ['⭐ Great effort'] : [],
      roadmapUpdates: [],
    };
  }
}
