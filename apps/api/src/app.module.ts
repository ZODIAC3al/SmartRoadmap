import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

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

@Module({
  imports: [
    // Fail fast on bad/missing config instead of silently degrading to mocks.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),

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
