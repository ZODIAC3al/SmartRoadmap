import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CodingChallenge, CodingChallengeSchema, ChallengeAttempt, ChallengeAttemptSchema } from '../../schemas/coding-challenge.schema';
import { CodeSubmission, CodeSubmissionSchema } from '../../schemas/code-submission.schema';
import { CodingChallengeService } from './coding-challenge.service';
import { CodingChallengeController } from './coding-challenge.controller';
import { CodeExecutionModule } from '../code-execution/code-execution.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CodingChallenge.name, schema: CodingChallengeSchema },
      { name: ChallengeAttempt.name, schema: ChallengeAttemptSchema },
      { name: CodeSubmission.name, schema: CodeSubmissionSchema },
    ]),
    CodeExecutionModule,
  ],
  controllers: [CodingChallengeController],
  providers: [CodingChallengeService],
  exports: [CodingChallengeService],
})
export class CodingChallengeModule {}
