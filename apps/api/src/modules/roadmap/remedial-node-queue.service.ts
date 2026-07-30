import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Topic } from '../../schemas/topic.schema';
import { UserTopicResult } from '../../schemas/user-topic-result.schema';
import { LLMService } from '../../ai/llm.service';

export interface RemedialNodeJobData {
  userId: string;
  topicId: string;
  trackId: string;
  failPercentage: number;
  topicTitle?: string;
}

export const REMEDIAL_THRESHOLD = 30; // 30% fail percentage threshold

@Injectable()
export class RemedialNodeQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemedialNodeQueueService.name);
  private queue?: Queue<RemedialNodeJobData>;
  private worker?: Worker<RemedialNodeJobData>;
  private readonly isRedisEnabled: boolean;
  private readonly memoryQueue: RemedialNodeJobData[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
    @InjectModel(UserTopicResult.name) private readonly topicResultModel: Model<UserTopicResult>,
    private readonly llmService: LLMService,
  ) {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    this.isRedisEnabled = !!redisHost;
  }

  async onModuleInit() {
    if (this.isRedisEnabled) {
      const connection = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: Number(this.configService.get<number>('REDIS_PORT', 6379)),
      };

      this.queue = new Queue<RemedialNodeJobData>('remedial-node-generation', { connection });
      this.worker = new Worker<RemedialNodeJobData>(
        'remedial-node-generation',
        async (job: Job<RemedialNodeJobData>) => {
          await this.processRemedialNodeJob(job.data);
        },
        { connection },
      );

      this.logger.log('RemedialNodeQueueService: Initialized BullMQ queue with Redis backend');
    } else {
      this.logger.log('RemedialNodeQueueService: Initialized with async memory queue fallback');
    }
  }

  async onModuleDestroy() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }

  /**
   * Enqueues a remedial node generation job asynchronously (not inline in request cycle).
   */
  async enqueueJob(data: RemedialNodeJobData): Promise<void> {
    this.logger.log(
      `Queueing remedial node generation for user ${data.userId}, topic ${data.topicId} (failPct=${data.failPercentage}%)`,
    );

    if (this.queue && this.isRedisEnabled) {
      await this.queue.add('generate-remedial-node', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } else {
      // Async memory queue fallback (non-blocking)
      this.memoryQueue.push(data);
      setImmediate(async () => {
        const nextJob = this.memoryQueue.shift();
        if (nextJob) {
          try {
            await this.processRemedialNodeJob(nextJob);
          } catch (err: any) {
            this.logger.error(`Error processing in-memory remedial job: ${err.message}`);
          }
        }
      });
    }
  }

  /**
   * Job processor logic: generates AI remedial node and inserts into graph per spec 3.2.
   */
  async processRemedialNodeJob(data: RemedialNodeJobData): Promise<void> {
    const { userId, topicId, trackId, failPercentage, topicTitle } = data;
    this.logger.log(`Processing remedial node job for topic "${topicId}" (failPct=${failPercentage}%)`);

    // 1. Fetch active roadmap for user
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!roadmap) {
      this.logger.warn(`No active roadmap found for user ${userId}`);
      return;
    }

    const failedModule = roadmap.modules.find((m) => m.id === topicId || m.title === topicTitle);
    const baseTitle = failedModule ? failedModule.title : topicTitle || topicId;

    // Check if remedial node already inserted for this topic
    const remedialNodeId = `remedial_${topicId}_${Date.now()}`;
    const alreadyInserted = roadmap.modules.some(
      (m) => m.id.includes(`remedial_${topicId}`) || m.title.toLowerCase().includes('remedial'),
    );

    if (alreadyInserted) {
      this.logger.log(`Remedial node already exists for topic ${topicId}`);
      return;
    }

    // 2. Call AI service to generate remedial node metadata
    const aiResponse = await this.llmService.generateRemedialNode(baseTitle, failPercentage);

    const title = aiResponse?.title || `${baseTitle} Fundamentals (Remedial)`;
    const description =
      aiResponse?.description ||
      `Targeted remedial practice node generated due to ${failPercentage}% failure rate on ${baseTitle}.`;

    // 3. Construct AI-generated node document per resources/spec.md section 3.2
    const prerequisites = failedModule ? failedModule.prerequisites : [];
    const positionX = failedModule ? (failedModule.positionX ?? 100) - 80 : 100;
    const positionY = failedModule ? (failedModule.positionY ?? 100) + 120 : 100;

    const newModuleItem = {
      id: remedialNodeId,
      title,
      description,
      difficulty: 'beginner' as const,
      estimatedHours: 3,
      topics: [baseTitle, 'Remedial Review'],
      prerequisites,
      status: 'in_progress' as const,
      positionX,
      positionY,
      type: 'ai_generated',
      generated_from_topic: topicId,
      generated_reason: 'fail_percentage_threshold',
      unlocks: [topicId],
    };

    roadmap.modules.push(newModuleItem as any);
    roadmap.markModified('modules');
    await roadmap.save();

    // 4. Update Topic collection for graph traversal
    const topicDoc = new this.topicModel({
      trackId,
      title,
      description,
      prerequisites: [],
      type: 'ai_generated',
      difficulty: 'beginner',
      generatedFromTopic: Types.ObjectId.isValid(topicId) ? new Types.ObjectId(topicId) : undefined,
      generatedReason: 'fail_percentage_threshold',
    });
    await topicDoc.save();

    // 5. Update UserTopicResult status
    await this.topicResultModel.updateOne(
      { userId: new Types.ObjectId(userId), topicId },
      { status: 'remedial_inserted' },
    );

    this.logger.log(
      `Successfully generated and inserted AI remedial node "${title}" (ID: ${remedialNodeId}) into track graph`,
    );
  }
}
