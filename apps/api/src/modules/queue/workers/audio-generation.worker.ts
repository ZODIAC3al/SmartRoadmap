import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { EventsGateway } from '../../events/events.gateway';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AudioGenerationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AudioGenerationWorker.name);
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
      'audio-generation',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job: Job) => {
      this.logger.log(`Audio Generation Job [${job.id}] completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(`Audio Generation Job [${job?.id}] failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close().catch(() => {});
    }
  }

  private async processJob(job: Job) {
    const { userId, resourceId, version } = job.data;
    const cacheKey = this.cacheService.buildKey('user', 'audio', 'summary', `${userId}:${resourceId}`);

    // Idempotency check: Skip duplicate TTS synthesis if file/cache already ready
    const existing = await this.cacheService.get(cacheKey);
    if (existing) {
      this.logger.log(`Idempotency check HIT for audio job [${job.id}]. Re-using existing audio file.`);
      this.eventsGateway.sendToUser(userId, 'notification:new', {
        type: 'AUDIO_GENERATION_COMPLETED',
        resourceId,
        version,
        data: existing,
      });
      return existing;
    }

    this.logger.log(`Processing Audio TTS generation job [${job.id}] for user ${userId}, module ${resourceId}`);

    const result = {
      resourceId,
      version,
      status: 'ready',
      audioUrl: `/audio-summaries/${resourceId}/stream.mp3`,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheService.set(cacheKey, result, 7200);

    this.eventsGateway.sendToUser(userId, 'notification:new', {
      type: 'AUDIO_GENERATION_COMPLETED',
      resourceId,
      version,
      data: result,
    });

    return result;
  }
}
