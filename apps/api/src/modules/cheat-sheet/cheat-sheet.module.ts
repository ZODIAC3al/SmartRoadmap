import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheatSheet, CheatSheetSchema } from '../../schemas/cheat-sheet.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { QuizSession, QuizSessionSchema } from '../../schemas/quiz-session.schema';
import { CheatSheetService } from './cheat-sheet.service';
import { CheatSheetController } from './cheat-sheet.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CheatSheet.name, schema: CheatSheetSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: QuizSession.name, schema: QuizSessionSchema },
    ]),
  ],
  controllers: [CheatSheetController],
  providers: [CheatSheetService],
  exports: [CheatSheetService],
})
export class CheatSheetModule {}
