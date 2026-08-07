import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { LearningResource, LearningResourceSchema } from '../../schemas/learning-resource.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { Cv, CvSchema } from '../../schemas/cv.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningResource.name, schema: LearningResourceSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Cv.name, schema: CvSchema },
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
