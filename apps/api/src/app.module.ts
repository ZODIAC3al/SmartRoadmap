import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AIModule } from './ai/ai.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RoadmapModule } from './modules/roadmap/roadmap.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { CvModule } from './modules/cv/cv.module';
import { AuthModule } from './modules/auth/auth.module';
import { HiringModule } from './modules/hiring/hiring.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MessageModule } from './modules/message/message.module';
import * as dns from 'dns';

async function getMongoUri(): Promise<string> {
  const localUri = 'mongodb://localhost:27017/smartroadmap';
  const targetUri = process.env.MONGODB_URI || localUri;

  if (targetUri.startsWith('mongodb+srv://')) {
    // Extract hostname (e.g. production.e8mvg0u.mongodb.net)
    const host = targetUri.split('@')[1]?.split('/')[0]?.split('?')[0];
    if (host && !host.includes(',')) {
      try {
        // Check if DNS can resolve the SRV record (avoids querySrv ECONNREFUSED crash)
        await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
        console.log(`[Mongoose] Successfully resolved DNS SRV for Atlas host: ${host}. Connecting to cloud.`);
        return targetUri;
      } catch (err: any) {
        console.error(`[Mongoose] DNS SRV query failed for ${host} (likely firewall, offline, or DNS filter). Falling back to local MongoDB.`, err.message);
        return localUri;
      }
    }
  }
  return targetUri;
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const uri = await getMongoUri();
        return { uri };
      },
    }),
    AIModule,
    PaymentModule,
    RoadmapModule,
    AssessmentModule,
    CvModule,
    AuthModule,
    HiringModule,
    UploadModule,
    NotificationModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
