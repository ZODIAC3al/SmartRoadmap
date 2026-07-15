import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { LLMService } from '../../ai/llm.service';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';

// Memory store for questions since we mock or fetch them dynamically
// In production, these can be cached in Redis or stored in the QuizSession document
const sessionQuestionsCache = new Map<string, any[]>();

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private readonly TOTAL_QUESTIONS = 5;

  constructor(
    @InjectModel(QuizSession.name)
    private readonly sessionModel: Model<QuizSession>,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    private readonly llmService: LLMService,
  ) {}

  async startSession(
    userId: string,
    moduleId: string,
    topic: string,
  ): Promise<any> {
    this.logger.log(
      `Starting quiz session for user ${userId}, module ${moduleId} (topic: "${topic}")`,
    );

    // 1. Generate questions pool (falls back to mock if OpenAI offline)
    // We generate 5 questions at 'medium' difficulty as starting baseline
    const questions = await this.llmService.generateQuiz(
      topic,
      'medium',
      this.TOTAL_QUESTIONS,
    );

    // 2. Create the session in MongoDB
    const session = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      moduleId,
      status: 'in_progress',
      answers: [],
    });
    const savedSession = await session.save();

    // Cache the full questions array in memory for response evaluations
    sessionQuestionsCache.set(savedSession._id.toString(), questions);

    const firstQuestion = questions[0];
    return {
      sessionId: savedSession._id.toString(),
      totalQuestions: this.TOTAL_QUESTIONS,
      currentQuestionIndex: 0,
      question: firstQuestion.question,
      options: firstQuestion.options,
      difficulty: 'medium',
    };
  }

  async submitAnswer(
    sessionId: string,
    answer: string,
    timeTaken = 10,
    user?: JwtUser,
  ): Promise<any> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.status === 'completed') {
      throw new BadRequestException(
        'Active session not found or already completed.',
      );
    }
    if (user) assertSelfOrAdmin(user, session.userId.toString());

    const questions = sessionQuestionsCache.get(sessionId);
    if (!questions) {
      throw new BadRequestException(
        'Session questions cache expired. Please restart quiz.',
      );
    }

    const currentIndex = session.answers.length;
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
      throw new BadRequestException('Invalid question index.');
    }

    // Evaluate answer correctness
    const correct =
      currentQuestion.correctAnswer.toLowerCase().trim() ===
      answer.toLowerCase().trim();

    // Log answer sub-document
    session.answers.push({
      question: currentQuestion.question,
      userAnswer: answer,
      correct,
      difficulty: currentQuestion.difficulty || 'medium',
      timeTaken,
    } as any);

    await session.save();

    // Compute consecutive stats to adjust difficulty for NEXT question
    const answersHistory = session.answers;
    let nextDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

    if (answersHistory.length >= 2) {
      const lastTwo = answersHistory.slice(-2);
      const allCorrect = lastTwo.every((ans) => ans.correct);
      const allIncorrect = lastTwo.every((ans) => !ans.correct);

      const currentDifficulty = lastTwo[1]?.difficulty || 'medium';

      if (allCorrect) {
        if (currentDifficulty === 'easy') nextDifficulty = 'medium';
        else if (currentDifficulty === 'medium') nextDifficulty = 'hard';
        else nextDifficulty = 'hard';
      } else if (allIncorrect) {
        if (currentDifficulty === 'hard') nextDifficulty = 'medium';
        else if (currentDifficulty === 'medium') nextDifficulty = 'easy';
        else nextDifficulty = 'easy';
      } else {
        nextDifficulty = currentDifficulty;
      }
    }

    const nextIndex = currentIndex + 1;
    const isFinished = nextIndex >= this.TOTAL_QUESTIONS;

    if (isFinished) {
      // Finalize Quiz Session
      session.status = 'completed';
      session.completedAt = new Date();

      // Calculate weighted score: easy=1, medium=1.5, hard=2
      let totalWeight = 0;
      let earnedWeight = 0;

      session.answers.forEach((ans) => {
        const weight =
          ans.difficulty === 'easy' ? 1 : ans.difficulty === 'medium' ? 1.5 : 2;
        totalWeight += weight;
        if (ans.correct) {
          earnedWeight += weight;
        }
      });

      const finalScorePercent =
        totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
      const passed = finalScorePercent >= 70;

      session.score = finalScorePercent;
      session.passed = passed;
      await session.save();

      // Clear cached session questions
      sessionQuestionsCache.delete(sessionId);

      // Adaptive outcome: passing unlocks what comes next, failing injects a
      // shorter remedial module instead of leaving the learner stuck.
      if (passed) {
        await this.unlockNextRoadmapModules(
          session.userId.toString(),
          session.moduleId,
        );
      } else {
        await this.addRemedialModule(
          session.userId.toString(),
          session.moduleId,
          session.answers,
        );
      }

      return {
        correct,
        explanation: currentQuestion.explanation,
        isFinished: true,
        results: {
          score: finalScorePercent,
          passed,
          correctAnswers: session.answers.filter((a) => a.correct).length,
          totalQuestions: this.TOTAL_QUESTIONS,
        },
      };
    }

    // Update difficulty of the next cached question dynamically
    const nextQuestion = questions[nextIndex];
    if (nextQuestion) {
      nextQuestion.difficulty = nextDifficulty;
    }

    return {
      correct,
      explanation: currentQuestion.explanation,
      isFinished: false,
      nextQuestion: {
        currentQuestionIndex: nextIndex,
        question: nextQuestion.question,
        options: nextQuestion.options,
        difficulty: nextDifficulty,
      },
    };
  }

  /**
   * Failed the quiz? Build a focused remedial module out of the exact questions
   * that were missed, and drop it right before the module they failed.
   */
  private async addRemedialModule(
    userId: string,
    failedModuleId: string,
    answers: any[],
  ): Promise<void> {
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!roadmap) return;

    const failedModule = roadmap.modules.find((m) => m.id === failedModuleId);
    if (!failedModule) return;

    const remedialId = `${failedModuleId}-remedial`;
    if (roadmap.modules.some((m) => m.id === remedialId)) {
      this.logger.log(`Remedial module already exists for ${failedModuleId}`);
      return;
    }

    // Weakest topics = whatever they answered wrong.
    const missedTopics = answers
      .filter((a) => !a.correct)
      .map((a) => String(a.question).slice(0, 60));

    failedModule.status = 'failed';

    roadmap.modules.push({
      id: remedialId,
      title: `Review: ${failedModule.title}`,
      description:
        'A shorter, targeted refresher generated from the questions you missed. ' +
        'Complete it to retry the original module.',
      difficulty: 'beginner',
      estimatedHours: Math.max(
        2,
        Math.round((failedModule.estimatedHours ?? 8) / 3),
      ),
      topics: missedTopics.length ? missedTopics : failedModule.topics,
      prerequisites: failedModule.prerequisites,
      status: 'in_progress',
      positionX: (failedModule.positionX ?? 100) - 60,
      positionY: (failedModule.positionY ?? 150) + 160,
    } as any);

    roadmap.markModified('modules');
    await roadmap.save();
    this.logger.log(`Added remedial module "${remedialId}" for user ${userId}`);
  }

  private async unlockNextRoadmapModules(
    userId: string,
    completedModuleId: string,
  ): Promise<void> {
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!roadmap) return;

    // 1. Mark completed module as completed
    const modules = roadmap.modules;
    const completedModule = modules.find((m) => m.id === completedModuleId);
    if (completedModule) {
      completedModule.status = 'completed';
    }

    // 2. Identify modules dependent on the completed module and unlock them
    modules.forEach((mod) => {
      if (
        mod.status === 'locked' &&
        mod.prerequisites.includes(completedModuleId)
      ) {
        // Verify if all other prerequisites for this locked module are completed
        const allPrereqsMet = mod.prerequisites.every((prereqId) => {
          const prereqMod = modules.find((m) => m.id === prereqId);
          return prereqMod && prereqMod.status === 'completed';
        });

        if (allPrereqsMet) {
          mod.status = 'in_progress';
          this.logger.log(
            `Roadmap auto-unlocked module: "${mod.title}" (ID: ${mod.id})`,
          );
        }
      }
    });

    // Save changes to active roadmap
    roadmap.markModified('modules');
    await roadmap.save();
  }
}
