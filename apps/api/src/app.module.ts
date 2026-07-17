import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { AIModule } from './ai/ai.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RoadmapModule } from './modules/roadmap/roadmap.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { CvModule } from './modules/cv/cv.module';
import { HiringModule } from './modules/hiring/hiring.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MessageModule } from './modules/message/message.module';
import { ProgressModule } from './modules/progress/progress.module';
import { StreakModule } from './modules/streak/streak.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CheatSheetModule } from './modules/cheat-sheet/cheat-sheet.module';
import { AudioSummaryModule } from './modules/audio-summary/audio-summary.module';
import { CodeExecutionModule } from './modules/code-execution/code-execution.module';
import { CodeDraftModule } from './modules/code-draft/code-draft.module';
import { CodingChallengeModule } from './modules/coding-challenge/coding-challenge.module';
import { VoiceAgentModule } from './modules/voice-agent/voice-agent.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // Fail fast on bad/missing config instead of silently degrading to mocks.
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // No more "DNS failed -> quietly connect to localhost" fallback:
        // that silently wrote production traffic into an empty local DB.
        uri: config.getOrThrow<string>('MONGODB_URI'),
        retryAttempts: config.get('NODE_ENV') === 'production' ? 5 : 2,
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60_000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    MailModule,
    AuthModule,
    AIModule,
    PaymentModule,
    RoadmapModule,
    AssessmentModule,
    CvModule,
    HiringModule,
    UploadModule,
    NotificationModule,
    MessageModule,
    ProgressModule,
    StreakModule,
    AchievementModule,
    CalendarModule,
    DashboardModule,
    CheatSheetModule,
    AudioSummaryModule,
    CodeExecutionModule,
    CodeDraftModule,
    CodingChallengeModule,
    VoiceAgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Auth is now DENY-BY-DEFAULT: every route requires a valid JWT unless it
    // is explicitly marked @Public(). Forgetting a guard can no longer expose data.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
