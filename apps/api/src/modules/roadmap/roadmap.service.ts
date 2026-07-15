import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { LLMService } from '../../ai/llm.service';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    private readonly llmService: LLMService,
  ) {}

  async generateRoadmap(
    userId: string,
    targetRole: string,
    skills: string[] = [],
  ): Promise<Roadmap> {
    this.logger.log(
      `Generating roadmap for user: ${userId}, target role: "${targetRole}"`,
    );

    // 1. Call AI service (falls back to mock if API key is not in .env)
    const generated = await this.llmService.generateRoadmap(targetRole, skills);

    // 2. Mark any existing roadmaps as archived
    await this.roadmapModel.updateMany(
      { userId: new Types.ObjectId(userId), status: 'active' },
      { status: 'archived' },
    );

    // 3. Save new roadmap to MongoDB
    const roadmap = new this.roadmapModel({
      userId: new Types.ObjectId(userId),
      title: generated.title,
      targetRole: targetRole,
      totalEstimatedHours: generated.totalEstimatedHours,
      status: 'active',
      modules: generated.modules.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        difficulty: m.difficulty,
        estimatedHours: m.estimatedHours,
        topics: m.topics,
        prerequisites: m.prerequisites,
        status: m.status || 'locked',
        positionX: m.positionX,
        positionY: m.positionY,
      })),
    });

    return roadmap.save();
  }

  async getActiveRoadmap(userId: string): Promise<Roadmap> {
    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!roadmap) {
      throw new NotFoundException(
        `No active roadmap found for user ID: ${userId}`,
      );
    }

    return roadmap;
  }

  /** Every by-id lookup is now ownership-checked (was a plain IDOR before). */
  async getRoadmapById(id: string, user?: JwtUser): Promise<Roadmap> {
    const roadmap = await this.roadmapModel.findById(id);
    if (!roadmap) {
      throw new NotFoundException(`Roadmap not found with ID: ${id}`);
    }
    if (user) assertSelfOrAdmin(user, roadmap.userId.toString());
    return roadmap;
  }

  async getRoadmapProgress(id: string, user?: JwtUser): Promise<any> {
    const roadmap = await this.getRoadmapById(id, user);
    const totalModules = roadmap.modules.length;
    const completedModules = roadmap.modules.filter(
      (m) => m.status === 'completed',
    ).length;
    const progressPercent =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    return {
      roadmapId: id,
      title: roadmap.title,
      totalModules,
      completedModules,
      progressPercent,
    };
  }

  async updateModuleStatus(
    id: string,
    moduleId: string,
    status: 'locked' | 'in_progress' | 'completed' | 'failed',
    user?: JwtUser,
  ): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(id, user);
    const mod = roadmap.modules.find((m) => m.id === moduleId);
    if (!mod) {
      throw new NotFoundException(
        `Module with ID ${moduleId} not found in roadmap ${id}`,
      );
    }

    mod.status = status;
    roadmap.markModified('modules');
    return roadmap.save();
  }

  async extendRoadmap(
    id: string,
    skills: string[],
    user?: JwtUser,
  ): Promise<Roadmap> {
    this.logger.log(
      `Extending roadmap ${id} with gap skills: ${skills.join(', ')}`,
    );
    const roadmap = await this.getRoadmapById(id, user);

    skills.forEach((skill) => {
      // Check if skill already exists in roadmap modules
      const exists = roadmap.modules.some(
        (m) =>
          m.title.toLowerCase() === skill.toLowerCase() ||
          m.id === skill.toLowerCase(),
      );
      if (!exists) {
        roadmap.modules.push({
          id: skill.toLowerCase().replace(/\s+/g, '-'),
          title: skill,
          description: `Learn ${skill} to close your skill gap and unlock targeted employment matching.`,
          difficulty: 'intermediate',
          estimatedHours: 8,
          topics: [skill],
          prerequisites: [],
          status: 'in_progress',
          positionX: 300,
          positionY: 300,
        } as any);
      }
    });

    roadmap.markModified('modules');
    return roadmap.save();
  }

  async deleteRoadmap(id: string, user?: JwtUser): Promise<any> {
    await this.getRoadmapById(id, user); // ownership check before destructive op
    const result = await this.roadmapModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Roadmap not found with ID: ${id}`);
    }
    return { success: true, message: `Roadmap ${id} deleted successfully.` };
  }

  async updateViewport(
    id: string,
    viewport: { x: number; y: number; zoom: number },
    edgeStyle?: 'straight' | 'curved',
    user?: JwtUser,
  ): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(id, user);
    roadmap.viewport = viewport;
    if (edgeStyle) {
      roadmap.edgeStyle = edgeStyle;
    }
    return roadmap.save();
  }
}
