import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LearningResource } from '../../schemas/learning-resource.schema';
import { CreateResourceDto } from './dto/resource.dto';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Cv } from '../../schemas/cv.schema';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);

  constructor(
    @InjectModel(LearningResource.name)
    private readonly resourceModel: Model<LearningResource>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Cv.name)
    private readonly cvModel: Model<Cv>,
  ) {}

  async create(dto: CreateResourceDto, userId: string): Promise<LearningResource> {
    this.logger.log(`User ${userId} submitting learning resource: ${dto.title}`);
    const resource = new this.resourceModel({
      ...dto,
      submittedBy: new Types.ObjectId(userId),
      upvotes: [userId], // Author upvotes by default
      score: 1,
    });
    return resource.save();
  }

  async vote(resourceId: string, userId: string, direction: 'up' | 'down'): Promise<LearningResource> {
    const resource = await this.resourceModel.findById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource not found with ID: ${resourceId}`);
    }

    const hadUpvote = resource.upvotes.includes(userId);
    const hadDownvote = resource.downvotes.includes(userId);

    // Filter out user from current arrays
    resource.upvotes = resource.upvotes.filter((id) => id !== userId);
    resource.downvotes = resource.downvotes.filter((id) => id !== userId);

    // Toggle off if the user re-clicks the direction they already voted for,
    // so votes can be retracted instead of being stuck permanently.
    if (direction === 'up' && !hadUpvote) {
      resource.upvotes.push(userId);
    } else if (direction === 'down' && !hadDownvote) {
      resource.downvotes.push(userId);
    }

    resource.score = resource.upvotes.length - resource.downvotes.length;
    return resource.save();
  }

  async findAll(query: {
    difficulty?: string;
    category?: string;
    type?: string;
    search?: string;
  }): Promise<LearningResource[]> {
    const filter: any = {};

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    if (query.category) {
      filter.category = new RegExp(query.category, 'i');
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
        { tags: new RegExp(query.search, 'i') },
      ];
    }

    const resources = await this.resourceModel
      .find(filter)
      .populate('submittedBy', 'name email avatarUrl')
      .sort({ score: -1, createdAt: -1 })
      .exec();
    // Guard against resources whose submitter account was deleted (dangling ref).
    return resources.filter((r) => r.submittedBy);
  }

  async getRecommendations(userId: string): Promise<LearningResource[]> {
    // 1. Get active roadmap topics
    let keywords: string[] = [];

    const activeRoadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (activeRoadmap) {
      keywords.push(activeRoadmap.targetRole || '');
      activeRoadmap.modules.forEach((mod) => {
        keywords.push(mod.title);
        keywords.push(...mod.topics);
      });
    }

    // 2. If roadmap keywords empty, fetch from CV skills
    if (keywords.length === 0) {
      const cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });
      if (cv && cv.skills) {
        keywords.push(...cv.skills);
      }
    }

    // Clean up keywords: unique, non-empty, and lowercase
    const cleanKeywords = Array.from(new Set(keywords))
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (cleanKeywords.length === 0) {
      // Fallback: return top 5 hot resources
      return this.resourceModel
        .find()
        .populate('submittedBy', 'name email avatarUrl')
        .sort({ score: -1 })
        .limit(5)
        .exec();
    }

    // Build $or query to match category, tags, title, or description
    const filterConditions = cleanKeywords.map((kw) => ({
      $or: [
        { title: new RegExp(kw, 'i') },
        { description: new RegExp(kw, 'i') },
        { category: new RegExp(kw, 'i') },
        { tags: new RegExp(kw, 'i') },
      ],
    }));

    return this.resourceModel
      .find({ $or: filterConditions })
      .populate('submittedBy', 'name email avatarUrl')
      .sort({ score: -1 })
      .limit(6)
      .exec();
  }
}
