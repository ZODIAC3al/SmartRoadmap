import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { ApplicantPipeline, ApplicantPipelineSchema } from '../../schemas/pipeline.schema';
import { Job, JobSchema } from '../../schemas/job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApplicantPipeline.name, schema: ApplicantPipelineSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService, MongooseModule],
})
export class PipelineModule {}
