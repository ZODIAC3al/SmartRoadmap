import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportController } from './export.controller';
import { CertificationExportService } from './certification-export.service';
import { AiUsageReportService } from './ai-usage-report.service';
import { BillingModule } from '../modules/billing/billing.module';
import { User, UserSchema } from '../schemas/user.schema';
import { Company, CompanySchema } from '../schemas/company.schema';
import { Roadmap, RoadmapSchema } from '../schemas/roadmap.schema';
import { Streak, StreakSchema } from '../schemas/streak.schema';
import {
  UserAchievement,
  UserAchievementSchema,
} from '../schemas/user-achievement.schema';
import {
  TrackCertification,
  TrackCertificationSchema,
} from '../schemas/track-certification.schema';

@Module({
  imports: [
    BillingModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Streak.name, schema: StreakSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: TrackCertification.name, schema: TrackCertificationSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [CertificationExportService, AiUsageReportService],
  exports: [CertificationExportService, AiUsageReportService],
})
export class ExportModule {}

