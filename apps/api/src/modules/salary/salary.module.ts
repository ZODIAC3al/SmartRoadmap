// apps/api/src/modules/salary/salary.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModule } from '../../ai/ai.module';
import { LearnerProfile, LearnerProfileSchema } from '../../schemas/learner-profile.schema';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';

@Module({
  imports: [
    AIModule,
    MongooseModule.forFeature([
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
    ]),
  ],
  providers: [SalaryService],
  controllers: [SalaryController],
  exports: [SalaryService],
})
export class SalaryModule {}
