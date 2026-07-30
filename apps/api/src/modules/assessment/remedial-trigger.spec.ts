import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssessmentService } from './assessment.service';
import { QuizSession } from '../../schemas/quiz-session.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { UserTopicResult } from '../../schemas/user-topic-result.schema';
import { RemedialNodeQueueService } from '../roadmap/remedial-node-queue.service';
import { LLMService } from '../../ai/llm.service';
import { CertificationExportService } from '../../export/certification-export.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { StreakService } from '../streak/streak.service';

describe('Remedial Node Generation Trigger', () => {
  let service: AssessmentService;
  let remedialQueueService: RemedialNodeQueueService;
  let topicResultModel: any;

  beforeEach(async () => {
    topicResultModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        { provide: getModelToken(QuizSession.name), useValue: {} },
        { provide: getModelToken(Roadmap.name), useValue: {} },
        {
          provide: getModelToken(UserTopicResult.name),
          useValue: topicResultModel,
        },
        {
          provide: RemedialNodeQueueService,
          useValue: { enqueueJob: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: StreakService,
          useValue: { recordActivity: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        { provide: LLMService, useValue: {} },
        {
          provide: CertificationExportService,
          useValue: {
            checkAndIssueCertification: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
    remedialQueueService = module.get<RemedialNodeQueueService>(
      RemedialNodeQueueService,
    );
  });

  it('should queue a BullMQ job when fail_percentage >= REMEDIAL_THRESHOLD', async () => {
    const mockDoc: any = {
      attempts: 0,
      failedAttempts: 0,
      failPercentage: 0,
      lastScore: 0,
      status: 'failed',
    };
    mockDoc.save = jest.fn().mockImplementation(() => Promise.resolve(mockDoc));

    topicResultModel.findOne.mockResolvedValue(mockDoc);

    const result = await service.recordTopicResult(
      '507f191e810c19729de860ea',
      'topic_css_layout',
      false,
      40,
      'track_frontend',
    );

    expect(result.attempts).toBe(1);
    expect(result.failedAttempts).toBe(1);
    expect(result.failPercentage).toBe(100); // 100% >= 30% REMEDIAL_THRESHOLD
    expect(result.status).toBe('remedial_inserted');

    expect(remedialQueueService.enqueueJob).toHaveBeenCalledWith({
      userId: '507f191e810c19729de860ea',
      topicId: 'topic_css_layout',
      trackId: 'track_frontend',
      failPercentage: 100,
    });
  });

  it('should NOT queue a BullMQ job when exam passes (fail_percentage remains low)', async () => {
    const mockDoc: any = {
      attempts: 0,
      failedAttempts: 0,
      failPercentage: 0,
      lastScore: 0,
      status: 'passed',
    };
    mockDoc.save = jest.fn().mockImplementation(() => Promise.resolve(mockDoc));

    topicResultModel.findOne.mockResolvedValue(mockDoc);

    const result = await service.recordTopicResult(
      '507f191e810c19729de860ea',
      'topic_html_basics',
      true,
      90,
      'track_frontend',
    );

    expect(result.attempts).toBe(1);
    expect(result.failedAttempts).toBe(0);
    expect(result.failPercentage).toBe(0);
    expect(result.status).toBe('passed');

    expect(remedialQueueService.enqueueJob).not.toHaveBeenCalled();
  });
});
