import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Topic } from '../../schemas/topic.schema';
import { LLMService } from '../../ai/llm.service';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    @InjectModel(Roadmap.name) private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
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

    const modules = Array.isArray(generated?.modules) ? generated.modules : [];
    const userObjId = this.safeUserObjectId(userId);

    // 3. Save new roadmap to MongoDB
    const roadmap = new this.roadmapModel({
      userId: userObjId,
      title: generated?.title || `Learning Roadmap for ${targetRole}`,
      targetRole: targetRole,
      totalEstimatedHours: generated?.totalEstimatedHours || 45,
      status: 'active',
      modules: modules.map((m: any, idx: number) => ({
        id: m.id || `mod-${idx + 1}`,
        title: m.title || `Module ${idx + 1}`,
        description: m.description || '',
        difficulty: this.sanitizeDifficulty(m.difficulty),
        estimatedHours:
          typeof m.estimatedHours === 'number' ? m.estimatedHours : 10,
        topics: Array.isArray(m.topics) ? m.topics : [],
        prerequisites: Array.isArray(m.prerequisites) ? m.prerequisites : [],
        status: this.sanitizeStatus(m.status, idx === 0),
        positionX:
          typeof m.positionX === 'number' ? m.positionX : 100 + idx * 200,
        positionY: typeof m.positionY === 'number' ? m.positionY : 150,
      })),
    });

    return roadmap.save();
  }

  async getActiveRoadmap(userId: string): Promise<any> {
    const userObjId = this.safeUserObjectId(userId);
    let roadmap: any = await this.roadmapModel.findOne({
      userId: userObjId,
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

  /**
   * Traverses a track's topic prerequisite tree recursively using MongoDB $graphLookup stage
   * per roadmap-graph skill instructions.
   */
  async getTrackGraphWithTraversal(
    trackId: string,
    startTopicId?: string,
  ): Promise<any[]> {
    const matchStage: any = { trackId };
    if (startTopicId && Types.ObjectId.isValid(startTopicId)) {
      matchStage._id = new Types.ObjectId(startTopicId);
    }

    return this.topicModel.aggregate([
      { $match: matchStage },
      {
        $graphLookup: {
          from: 'topics',
          startWith: '$prerequisites',
          connectFromField: 'prerequisites',
          connectToField: '_id',
          as: 'prerequisiteAncestors',
          maxDepth: 10,
          depthField: 'depthLevel',
        },
      },
    ]);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Safely converts a string userId to a Mongoose ObjectId.
   * Falls back to a new ObjectId if the string is invalid.
   */
  private safeUserObjectId(userId: string): Types.ObjectId {
    return Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : new Types.ObjectId();
  }

  /**
   * Ensures difficulty is one of the allowed enum values.
   */
  private sanitizeDifficulty(
    d: unknown,
  ): 'beginner' | 'intermediate' | 'advanced' {
    const allowed = ['beginner', 'intermediate', 'advanced'];
    return allowed.includes(d as string)
      ? (d as 'beginner' | 'intermediate' | 'advanced')
      : 'intermediate';
  }

  /**
   * Ensures status is a valid module status.
   * The first module defaults to 'in_progress' if not specified.
   */
  private sanitizeStatus(
    s: unknown,
    isFirst: boolean,
  ): 'locked' | 'in_progress' | 'completed' | 'failed' {
    const allowed = ['locked', 'in_progress', 'completed', 'failed'];
    if (allowed.includes(s as string)) {
      return s as 'locked' | 'in_progress' | 'completed' | 'failed';
    }
    return isFirst ? 'in_progress' : 'locked';
  }
}
