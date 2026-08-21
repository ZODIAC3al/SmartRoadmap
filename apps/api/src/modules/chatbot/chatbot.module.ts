import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ScopeClassifierService } from './scope-classifier.service';
import {
  ChatSession,
  ChatSessionSchema,
} from '../../schemas/chat-session.schema';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    RoadmapModule,
    AdminModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, ScopeClassifierService],
  exports: [ChatbotService, ScopeClassifierService],
})
export class ChatbotModule {}
