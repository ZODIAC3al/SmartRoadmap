import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company, CompanySchema } from '../../schemas/company.schema';
import { Job, JobSchema } from '../../schemas/job.schema';
import { ApplicantPipeline, ApplicantPipelineSchema } from '../../schemas/pipeline.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema },
      { name: ApplicantPipeline.name, schema: ApplicantPipelineSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UploadModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService, MongooseModule],
})
export class CompanyModule {}
