import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AudioSummary, AudioSummarySchema } from '../../schemas/audio-summary.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { AudioSummaryService } from './audio-summary.service';
import { AudioSummaryController } from './audio-summary.controller';
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AudioSummary.name, schema: AudioSummarySchema },
      { name: Roadmap.name, schema: RoadmapSchema },
    ]),
    AudioModule,
  ],
  controllers: [AudioSummaryController],
  providers: [AudioSummaryService],
  exports: [AudioSummaryService],
})
export class AudioSummaryModule {}
