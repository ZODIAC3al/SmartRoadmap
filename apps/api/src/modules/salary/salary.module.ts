import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModule } from '../../ai/ai.module';
import { LearnerProfile, LearnerProfileSchema } from '../../schemas/learner-profile.schema';
import { AdzunaService } from './adzuna.service';
import { SalaryCacheService } from './salary-cache.service';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';

@Module({
  imports: [
    AIModule,
    MongooseModule.forFeature([
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
    ]),
  ],
  providers: [
    AdzunaService,
    SalaryCacheService,
    SalaryService,
  ],
  controllers: [SalaryController],
  exports: [SalaryService],
})
export class SalaryModule {}
