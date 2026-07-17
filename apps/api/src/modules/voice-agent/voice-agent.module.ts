import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { VoiceAgentController } from './voice-agent.controller';
import { VoiceAgentService } from './voice-agent.service';

@Module({
  imports: [ConfigModule],
  controllers: [VoiceAgentController],
  providers: [VoiceAgentService],
})
export class VoiceAgentModule {}
