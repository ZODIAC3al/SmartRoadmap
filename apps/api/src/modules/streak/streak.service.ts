import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Streak } from '../../schemas/streak.schema';

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    @InjectModel(Streak.name)
    private readonly streakModel: Model<Streak>,
  ) {}

  async getOrCreateStreak(userId: string): Promise<Streak> {
    let streak = await this.streakModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!streak) {
      streak = new this.streakModel({
        userId: new Types.ObjectId(userId),
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        freezesAvailable: 2,
        timezone: 'UTC',
      });
      await streak.save();
    }
    return streak;
  }

  async recordActivity(userId: string, clientTimezone = 'UTC'): Promise<Streak> {
    const streak = await this.getOrCreateStreak(userId);
    
    // Resolve timezone
    let tz = clientTimezone;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      tz = streak.timezone || 'UTC';
    }
    streak.timezone = tz;

    // Compute today and yesterday
    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: tz }); // 'YYYY-MM-DD'
    
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA', { timeZone: tz }); // 'YYYY-MM-DD'

    this.logger.log(`Recording activity for User ${userId}. Today: ${today}, Yesterday: ${yesterday}, Stored: ${streak.lastActivityDate}`);

    if (streak.lastActivityDate === today) {
      // Already recorded activity today
      return streak;
    }

    if (streak.lastActivityDate === '') {
      // First activity ever
      streak.currentStreak = 1;
      streak.longestStreak = 1;
    } else if (streak.lastActivityDate === yesterday) {
      // Consecutive day
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    } else {
      // Gap detected (streak broken or freeze consumed)
      // Check if they skipped exactly 1 day and have freezes
      // Since it wasn't yesterday, check if freeze can salvage it.
      // If we skipped, lastActivityDate is older than yesterday.
      if (streak.freezesAvailable > 0) {
        streak.freezesAvailable -= 1;
        // Keep current streak, but we need to increment for today's new activity
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
        this.logger.log(`Streak freeze consumed for User ${userId}. Remaining freezes: ${streak.freezesAvailable}`);
      } else {
        // Reset streak
        streak.currentStreak = 1;
      }
    }

    streak.lastActivityDate = today;
    return streak.save();
  }
}
