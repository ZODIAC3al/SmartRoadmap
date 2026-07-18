// apps/api/src/modules/interview/interview.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InterviewEngine } from './interview-engine';
import { StartInterviewDto, SubmitInterviewAnswerDto } from './dto/interview.dto';
import { InterviewSession, InterviewSessionDocument, InterviewConfig, InterviewStatus } from '../../schemas/interview-session.schema';
import { InterviewReport, InterviewReportDocument } from '../../schemas/interview-report.schema';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private readonly engine: InterviewEngine,
    @InjectModel(InterviewSession.name) private readonly sessionModel: Model<InterviewSessionDocument>,
    @InjectModel(InterviewReport.name) private readonly reportModel: Model<InterviewReportDocument>,
  ) {}

  /** Start a new interview session */
  async startInterview(dto: StartInterviewDto, userId: string) {
    const config: InterviewConfig = {
      type: dto.type as any,
      difficulty: dto.difficulty as any,
      durationMinutes: dto.durationMinutes,
      language: dto.language as any,
      mode: dto.mode as any,
    };

    const sessionData: Record<string, any> = {
      userId,
      config,
      status: InterviewStatus.InProgress,
      startedAt: new Date(),
      currentQuestionIndex: 0,
      questions: [],
      answers: [],
    };
    if (dto.roadmapId) sessionData.roadmapId = dto.roadmapId;

    const session = new this.sessionModel(sessionData);

    const first = await this.engine.generateFirstQuestion(config, dto.roadmapId ?? 'general');
    session.questions = [{ id: first.id, text: first.text }];
    await session.save();

    return {
      sessionId: session._id.toString(),
      question: { id: first.id, text: first.text },
      questionNumber: 1,
      totalQuestions: first.totalQuestions,
    };
  }

  /** Submit answer for current question and get next question (or finish) */
  async submitAnswer(sessionId: string, dto: SubmitInterviewAnswerDto) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewStatus.InProgress) {
      throw new BadRequestException('Session is not active');
    }

    this.logger.log(`Submitting answer for session ${sessionId}, questionIndex: ${session.currentQuestionIndex}`);
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) throw new BadRequestException('No current question found');

    const questionNumber = session.currentQuestionIndex + 1; // 1-based count of answered questions
    const usedTexts = session.questions.map((q: any) => q.text);

    this.logger.log(`Evaluating answer for session ${sessionId}, question number ${questionNumber}`);

    const evaluation = await this.engine.evaluateAnswer(
      currentQuestion.id,
      currentQuestion.text,
      dto.answer ?? '',
      session.config,
      questionNumber,
      usedTexts,
    );

    this.logger.log(`Evaluation complete. Score: ${evaluation.score}. Recording answer in DB...`);
    // Record answer with all metadata
    session.answers.push({
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answer: dto.answer ?? '',
      timeTaken: dto.timeTaken ?? 0,
      skipped: dto.skipped ?? false,
      score: evaluation.score,
      feedback: evaluation.feedback,
      idealAnswer: evaluation.idealAnswer,
      correctness: evaluation.correctness,
      improvementTips: evaluation.improvementTips,
    });
    this.logger.log(`Session answers array updated. Total answers: ${session.answers.length}`);

    if (evaluation.finished || !evaluation.nextQuestion) {
      // Session complete — generate and save report immediately
      session.status = InterviewStatus.Completed;
      session.completedAt = new Date();
      this.logger.log(`Saving updated session status as completed...`);
      await session.save();

      this.logger.log(`Building final report for session ${sessionId} after answering final question.`);
      const reportData = await this.engine.buildReport(
        sessionId,
        session.userId,
        session.config,
        session.answers.map((a: any) => ({
          questionId: a.questionId,
          questionText: a.questionText ?? a.questionId,
          answer: a.answer ?? '',
          score: a.score ?? 0,
          feedback: a.feedback ?? '',
          idealAnswer: a.idealAnswer ?? '',
          correctness: a.correctness ?? 'incorrect',
          improvementTips: a.improvementTips ?? '',
        })),
      );

      this.logger.log(`Attempting to save final report in DB for session ${sessionId}`);
      let savedReport;
      try {
        savedReport = await this.reportModel.create(reportData);
        this.logger.log(`Successfully saved report in DB with ID: ${savedReport._id}`);
      } catch (err: any) {
        this.logger.error(`Failed to save report in submitAnswer DB write: ${err.stack || err.message}`);
        savedReport = { ...reportData, status: 'error_saving' };
      }
      return { finished: true, report: savedReport };
    }

    // Add next question to session
    session.questions.push({ id: evaluation.nextQuestion.id, text: evaluation.nextQuestion.text });
    session.currentQuestionIndex += 1;
    this.logger.log(`Saving active session state. New currentQuestionIndex: ${session.currentQuestionIndex}`);
    await session.save();

    return {
      finished: false,
      feedback: evaluation.feedback,
      score: evaluation.score,
      idealAnswer: evaluation.idealAnswer,
      correctness: evaluation.correctness,
      improvementTips: evaluation.improvementTips,
      nextQuestion: evaluation.nextQuestion,
      questionNumber: session.currentQuestionIndex + 1,
    };
  }

  /** Pause interview */
  async pause(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewStatus.InProgress) {
      throw new BadRequestException('Cannot pause a session that is not in progress');
    }
    session.status = InterviewStatus.Paused;
    session.pausedAt = new Date();
    await session.save();
    return { message: 'Interview paused' };
  }

  /** Resume interview */
  async resume(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status !== InterviewStatus.Paused) {
      throw new BadRequestException('Session is not paused');
    }
    session.status = InterviewStatus.InProgress;
    session.pausedAt = undefined;
    await session.save();
    const currentQ = session.questions[session.currentQuestionIndex];
    return {
      message: 'Interview resumed',
      question: currentQ,
      questionNumber: session.currentQuestionIndex + 1,
    };
  }

  /** Manually end interview early and generate report */
  async endInterview(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.status === InterviewStatus.Completed) {
      // Already done — just return existing report
      return this.getReport(sessionId);
    }

    session.status = InterviewStatus.Completed;
    session.completedAt = new Date();
    await session.save();

    this.logger.log(`Building report for session ${sessionId} after early termination.`);
    const reportData = await this.engine.buildReport(
      sessionId,
      session.userId,
      session.config,
      session.answers.map((a: any) => ({
        questionId: a.questionId,
        questionText: a.questionText ?? a.questionId,
        answer: a.answer ?? '',
        score: a.score ?? 0,
        feedback: a.feedback ?? '',
        idealAnswer: a.idealAnswer ?? '',
        correctness: a.correctness ?? 'incorrect',
        improvementTips: a.improvementTips ?? '',
      })),
    );

    this.logger.log(`Attempting to save manually ended interview report in DB for session ${sessionId}`);
    let saved;
    try {
      saved = await this.reportModel.create(reportData);
      this.logger.log(`Successfully saved manually ended report with ID: ${saved._id}`);
    } catch (err: any) {
      this.logger.error(`Failed to save report in endInterview DB write: ${err.stack || err.message}`);
      saved = { ...reportData, status: 'error_saving' };
    }
    return { finished: true, report: saved };
  }

  /** Fetch a completed interview report by sessionId */
  async getReport(sessionId: string) {
    this.logger.log(`Fetching report for session ${sessionId}`);
    let report = await this.reportModel.findOne({ sessionId }).lean();
    if (!report) {
      this.logger.log(`Report not found in DB for session ${sessionId}. Checking session status...`);
      const session = await this.sessionModel.findById(sessionId);
      if (session) {
        this.logger.log(`Session found for ${sessionId}. Status is ${session.status}`);
        if (session.status === InterviewStatus.Completed || session.status === InterviewStatus.TimedOut) {
          this.logger.warn(`Session ${sessionId} is completed but no report was found in DB. Triggering self-healing report generation.`);
          try {
            this.logger.log(`Self-healing: generating report for session ${sessionId}`);
            const reportData = await this.engine.buildReport(
              sessionId,
              session.userId,
              session.config,
              session.answers.map((a: any) => ({
                questionId: a.questionId,
                questionText: a.questionText ?? a.questionId,
                answer: a.answer ?? '',
                score: a.score ?? 0,
                feedback: a.feedback ?? '',
                idealAnswer: a.idealAnswer ?? '',
                correctness: a.correctness ?? 'incorrect',
                improvementTips: a.improvementTips ?? '',
              })),
            );

            this.logger.log(`Self-healing: saving report to DB for session ${sessionId}`);
            const saved = await this.reportModel.create(reportData);
            this.logger.log(`Self-healing: successfully saved report for session ${sessionId}`);
            return { status: 'ready', report: saved.toObject() };
          } catch (err: any) {
            this.logger.error(`Self-healing report generation failed for ${sessionId}: ${err.stack || err.message}`);
            return { status: 'error', message: `Report generation failed due to a server error: ${err.message}` };
          }
        }
        return { status: 'pending', message: 'Report is still being generated or session is active.' };
      }
      this.logger.warn(`Session not found for id: ${sessionId}`);
      throw new NotFoundException('Report not found');
    }
    this.logger.log(`Report successfully retrieved from DB for session ${sessionId}`);
    return { status: 'ready', report };
  }

  /** List all past sessions for a user (history) */
  async getUserSessions(userId: string) {
    return this.sessionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('status config startedAt completedAt currentQuestionIndex')
      .lean();
  }
}
