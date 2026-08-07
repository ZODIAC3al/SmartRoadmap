import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Streak, StreakSchema } from '../../schemas/streak.schema';
import { StreakService } from './streak.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Streak.name, schema: StreakSchema }]),
  ],
  providers: [StreakService],
  exports: [StreakService],
})
export class StreakModule {}
