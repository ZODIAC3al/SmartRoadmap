import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressSnapshot, ProgressSnapshotSchema } from '../../schemas/progress-snapshot.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProgressSnapshot.name, schema: ProgressSnapshotSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
    ]),
  ],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
