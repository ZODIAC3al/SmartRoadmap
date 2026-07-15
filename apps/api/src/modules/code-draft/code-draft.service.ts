import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CodeDraft } from '../../schemas/code-draft.schema';

@Injectable()
export class CodeDraftService {
  constructor(
    @InjectModel(CodeDraft.name)
    private readonly draftModel: Model<CodeDraft>,
  ) {}

  async getDraft(userId: string, challengeId: string | null): Promise<CodeDraft | null> {
    const query = challengeId 
      ? { userId: new Types.ObjectId(userId), challengeId }
      : { userId: new Types.ObjectId(userId), challengeId: null, title: 'scratchpad' };
    return this.draftModel.findOne(query).exec();
  }

  async saveDraft(
    userId: string,
    challengeId: string | null,
    language: string,
    code: string,
    title?: string,
  ): Promise<CodeDraft> {
    const query = challengeId 
      ? { userId: new Types.ObjectId(userId), challengeId }
      : { userId: new Types.ObjectId(userId), challengeId: null, title: 'scratchpad' };

    const update = {
      $set: {
        language,
        code,
        title: challengeId ? null : (title || 'scratchpad'),
      },
    };

    const draft = await this.draftModel.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
    });
    return draft;
  }
}
