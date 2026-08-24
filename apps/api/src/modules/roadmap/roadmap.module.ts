import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { Topic, TopicSchema } from '../../schemas/topic.schema';

import { RemedialNodeQueueService } from './remedial-node-queue.service';
import {
  UserTopicResult,
  UserTopicResultSchema,
} from '../../schemas/user-topic-result.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: UserTopicResult.name, schema: UserTopicResultSchema },
    ]),
  ],
  controllers: [RoadmapController],
  providers: [RoadmapService, RemedialNodeQueueService],
  exports: [RoadmapService, RemedialNodeQueueService],
})
export class RoadmapModule {}
