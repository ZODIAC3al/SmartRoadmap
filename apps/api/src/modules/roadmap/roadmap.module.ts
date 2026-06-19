import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
    ]),
  ],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
