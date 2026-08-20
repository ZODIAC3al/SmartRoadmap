import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Report, ReportSchema } from '../../schemas/report.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import {
  QuizSession,
  QuizSessionSchema,
} from '../../schemas/quiz-session.schema';
import { Post, PostSchema } from '../../schemas/post.schema';
import { Comment, CommentSchema } from '../../schemas/comment.schema';
import {
  LearningResource,
  LearningResourceSchema,
} from '../../schemas/learning-resource.schema';
import {
  MentorProfile,
  MentorProfileSchema,
} from '../../schemas/mentor-profile.schema';
import {
  MentorshipSession,
  MentorshipSessionSchema,
} from '../../schemas/mentorship-session.schema';
import {
  Certificate,
  CertificateSchema,
} from '../../schemas/certificate.schema';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Report.name, schema: ReportSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: LearningResource.name, schema: LearningResourceSchema },
      { name: MentorProfile.name, schema: MentorProfileSchema },
      { name: MentorshipSession.name, schema: MentorshipSessionSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
    AIModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
