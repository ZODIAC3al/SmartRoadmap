import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeDraft, CodeDraftSchema } from '../../schemas/code-draft.schema';
import { CodeDraftService } from './code-draft.service';
import { CodeDraftController } from './code-draft.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CodeDraft.name, schema: CodeDraftSchema }]),
  ],
  controllers: [CodeDraftController],
  providers: [CodeDraftService],
  exports: [CodeDraftService],
})
export class CodeDraftModule {}
