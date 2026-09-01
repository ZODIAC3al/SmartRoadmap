import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { EventsGateway } from '../../events/events.gateway';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PdfGenerationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfGenerationWorker.name);
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
      'pdf-generation',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job: Job) => {
      this.logger.log(`PDF Generation Job [${job.id}] completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(`PDF Generation Job [${job?.id}] failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close().catch(() => {});
    }
  }

  private async processJob(job: Job) {
    const { userId, resourceId, version } = job.data;
    const cacheKey = this.cacheService.buildKey('user', 'pdf', 'report', `${userId}:${resourceId}`);

    const existing = await this.cacheService.get(cacheKey);
    if (existing) {
      this.logger.log(`Idempotency check HIT for PDF job [${job.id}].`);
      this.eventsGateway.sendToUser(userId, 'notification:new', {
        type: 'PDF_GENERATION_COMPLETED',
        resourceId,
        version,
        data: existing,
      });
      return existing;
    }

    this.logger.log(`Processing PDF export job [${job.id}] for user ${userId}`);

    const result = {
      resourceId,
      version,
      status: 'ready',
      downloadUrl: `/reports/${resourceId}.pdf`,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheService.set(cacheKey, result, 7200);

    this.eventsGateway.sendToUser(userId, 'notification:new', {
      type: 'PDF_GENERATION_COMPLETED',
      resourceId,
      version,
      data: result,
    });

    return result;
  }
}
