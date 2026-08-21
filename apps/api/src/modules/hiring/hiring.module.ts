import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../../schemas/job.schema';
import {
  JobApplication,
  JobApplicationSchema,
} from '../../schemas/job-application.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import {
  QuizSession,
  QuizSessionSchema,
} from '../../schemas/quiz-session.schema';
import { Cv, CvSchema } from '../../schemas/cv.schema';
import {
  TrackCertification,
  TrackCertificationSchema,
} from '../../schemas/track-certification.schema';
import {
  Certificate,
  CertificateSchema,
} from '../../schemas/certificate.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import {
  CompanyProfile,
  CompanyProfileSchema,
} from '../../schemas/company-profile.schema';
import { HiringService } from './hiring.service';
import { HiringController } from './hiring.controller';
import { SavedSearch, SavedSearchSchema } from '../../schemas/saved-search.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: JobApplication.name, schema: JobApplicationSchema },
      { name: User.name, schema: UserSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: Cv.name, schema: CvSchema },
      { name: TrackCertification.name, schema: TrackCertificationSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: CompanyProfile.name, schema: CompanyProfileSchema },
      { name: SavedSearch.name, schema: SavedSearchSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    BillingModule,
  ],
  controllers: [HiringController],
  providers: [HiringService],
  exports: [HiringService],
})
export class HiringModule {}
