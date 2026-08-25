import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { IngestionService } from './ingestion.service';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import {
  LearningResource,
  LearningResourceSchema,
} from '../../schemas/learning-resource.schema';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: LearningResource.name, schema: LearningResourceSchema },
    ]),
    AIModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, IngestionService],
  exports: [SearchService],
})
export class SearchModule {}
