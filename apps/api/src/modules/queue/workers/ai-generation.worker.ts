import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { EventsGateway } from '../../events/events.gateway';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AiGenerationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiGenerationWorker.name);
  private worker!: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly eventsGateway: EventsGateway,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.config.get<number>('REDIS_PORT', 6379);

    this.worker = new Worker(
      'ai-generation',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job: Job) => {
      this.logger.log(`AI Generation Job [${job.id}] completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(`AI Generation Job [${job?.id}] failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close().catch(() => {});
    }
  }

  /**
   * Idempotent worker execution. Checks cache / state before processing.
   */
  private async processJob(job: Job) {
    const { userId, resourceId, version, jobType } = job.data;
    const cacheKey = this.cacheService.buildKey('user', 'ai', 'summary', `${userId}:${resourceId}`);

    // Idempotency check: Skip duplicate processing if already completed
    const existing = await this.cacheService.get(cacheKey);
    if (existing) {
      this.logger.log(`Idempotency check HIT for job [${job.id}]. Re-using existing generated content.`);
      this.eventsGateway.sendToUser(userId, 'notification:new', {
        type: 'AI_GENERATION_COMPLETED',
        resourceId,
        version,
        data: existing,
      });
      return existing;
    }

    // Process AI work payload
    this.logger.log(`Processing AI generation job [${job.id}] for user ${userId}, module ${resourceId}`);

    const result = {
      resourceId,
      version,
      status: 'completed',
      generatedAt: new Date().toISOString(),
      summary: `AI generated learning path synthesis for ${resourceId}`,
    };

    // Cache generated result
    await this.cacheService.set(cacheKey, result, 3600);

    // Notify user via Socket.IO
    this.eventsGateway.sendToUser(userId, 'notification:new', {
      type: 'AI_GENERATION_COMPLETED',
      resourceId,
      version,
      data: result,
    });

    return result;
  }
}
