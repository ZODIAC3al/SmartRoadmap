import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AiGenerationWorker } from './workers/ai-generation.worker';
import { AudioGenerationWorker } from './workers/audio-generation.worker';
import { PdfGenerationWorker } from './workers/pdf-generation.worker';
import { EventsModule } from '../events/events.module';

@Global()
@Module({
  imports: [EventsModule],
  providers: [
    QueueService,
    AiGenerationWorker,
    AudioGenerationWorker,
    PdfGenerationWorker,
  ],
  exports: [QueueService],
})
export class QueueModule {}
