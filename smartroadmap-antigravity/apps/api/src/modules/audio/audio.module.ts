import { Module } from '@nestjs/common';
import { AudioController } from './audio.controller';
import { AppwriteService } from './appwrite.service';

@Module({
  controllers: [AudioController],
  providers: [AppwriteService],
  exports: [AppwriteService],
})
export class AudioModule {}
