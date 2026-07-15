import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProgressSnapshot } from '../../schemas/progress-snapshot.schema';
import { Roadmap } from '../../schemas/roadmap.schema';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectModel(ProgressSnapshot.name)
    private readonly snapshotModel: Model<ProgressSnapshot>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
  ) {}

  async record(
    userId: string,
    roadmapId: string,
    moduleId: string,
    event: 'module_started' | 'module_completed' | 'module_failed' | 'quiz_attempt',
    scoreAtEvent = 0,
    timeSpentSeconds = 0,
  ): Promise<ProgressSnapshot> {
    this.logger.log(`Recording progress snapshot: User ${userId}, Module ${moduleId}, Event ${event}`);
    const created = new this.snapshotModel({
      userId: new Types.ObjectId(userId),
      roadmapId: new Types.ObjectId(roadmapId),
      moduleId,
      event,
      scoreAtEvent,
      timeSpentSeconds,
    });
    return created.save();
  }

  async getRoadmapProgress(userId: string, roadmapId: string): Promise<number> {
    const roadmap = await this.roadmapModel.findOne({
      _id: new Types.ObjectId(roadmapId),
      userId: new Types.ObjectId(userId),
    });
    if (!roadmap || !roadmap.modules || roadmap.modules.length === 0) {
      return 0;
    }

    const completed = roadmap.modules.filter((m) => m.status === 'completed').length;
    return Math.round((completed / roadmap.modules.length) * 100);
  }

  async getTrends(userId: string, moduleId: string): Promise<{ date: string; score: number }[]> {
    const snapshots = await this.snapshotModel
      .find({
        userId: new Types.ObjectId(userId),
        moduleId,
        event: { $in: ['quiz_attempt', 'module_completed', 'module_failed'] },
      })
      .sort({ createdAt: 1 })
      .limit(10)
      .exec();

    return snapshots.map((s) => {
      const created = (s as any).createdAt || (s as any).created_at;
      return {
        date: created ? new Date(created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        score: s.scoreAtEvent,
      };
    });
  }
}
