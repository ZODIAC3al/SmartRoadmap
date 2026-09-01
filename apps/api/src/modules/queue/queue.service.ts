import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export type QueueName =
  | 'ai-generation'
  | 'audio-generation'
  | 'pdf-generation'
  | 'notifications'
  | 'analytics'
  | 'cache-refresh';

export interface EnqueueJobOptions {
  userId: string;
  resourceId: string;
  version?: string;
  payload: Record<string, any>;
  attempts?: number;
  backoffDelayMs?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues = new Map<QueueName, Queue>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.config.get<number>('REDIS_PORT', 6379);

    const connection = { host, port };
    const queueNames: QueueName[] = [
      'ai-generation',
      'audio-generation',
      'pdf-generation',
      'notifications',
      'analytics',
      'cache-refresh',
    ];

    queueNames.forEach((name) => {
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
      this.queues.set(name, queue);
    });

    this.logger.log(`Initialized ${queueNames.length} BullMQ queues connected to Redis at ${host}:${port}`);
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) {
      await queue.close().catch(() => {});
    }
  }

  /**
   * Enqueues job with job-type-aware structured ID format:
   * {jobType}:{userId}:{resourceId}:{version}
   */
  async enqueue(queueName: QueueName, jobType: string, opts: EnqueueJobOptions): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" is not registered.`);
    }

    const version = opts.version || 'v1';
    const jobId = `${jobType}:${opts.userId}:${opts.resourceId}:${version}`;

    const jobData = {
      jobType,
      userId: opts.userId,
      resourceId: opts.resourceId,
      version,
      ...opts.payload,
      enqueuedAt: new Date().toISOString(),
    };

    const job = await queue.add(jobType, jobData, {
      jobId,
      attempts: opts.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: opts.backoffDelayMs || 2000,
      },
    });

    this.logger.log(`Enqueued BullMQ job [${jobId}] on queue "${queueName}"`);
    return job.id || jobId;
  }

  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }
}
