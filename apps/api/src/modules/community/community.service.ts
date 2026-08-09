import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiscussionSpace } from '../../schemas/discussion-space.schema';
import { Post } from '../../schemas/post.schema';
import { Comment } from '../../schemas/comment.schema';
import { Report } from '../../schemas/report.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { Cv } from '../../schemas/cv.schema';
import { CreateSpaceDto, CreatePostDto, CreateCommentDto, CreateReportDto } from './dto/community.dto';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    @InjectModel(DiscussionSpace.name)
    private readonly spaceModel: Model<DiscussionSpace>,
    @InjectModel(Post.name)
    private readonly postModel: Model<Post>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    @InjectModel(Cv.name)
    private readonly cvModel: Model<Cv>,
  ) {}

  // ───────────────────────────── Spaces ─────────────────────────────

  async createSpace(dto: CreateSpaceDto, userId: string): Promise<DiscussionSpace> {
    this.logger.log(`Creating discussion space: ${dto.name}`);
    const exists = await this.spaceModel.findOne({ name: dto.name });
    if (exists) {
      throw new BadRequestException(`Space with name "${dto.name}" already exists`);
    }

    const space = new this.spaceModel({
      ...dto,
      createdBy: new Types.ObjectId(userId),
    });
    return space.save();
  }

  async findAllSpaces(userId?: string): Promise<any[]> {
    let spaces = await this.spaceModel.find().populate('createdBy', 'name email').exec();
    if (spaces.length === 0) {
      const creatorId = new Types.ObjectId();
      const defaults = [
        { name: 'general', description: 'General discussions and news', category: 'General', skills: [] },
        { name: 'javascript', description: 'JavaScript programming language discussion', category: 'Programming', skills: ['javascript'] },
        { name: 'react', description: 'React frontend framework discussions', category: 'Frontend', skills: ['react', 'nextjs'] },
        { name: 'nodejs', description: 'Node.js backend environment discussion', category: 'Backend', skills: ['nodejs', 'express'] },
      ];
      for (const d of defaults) {
        await new this.spaceModel({ ...d, createdBy: creatorId }).save();
      }
      spaces = await this.spaceModel.find().populate('createdBy', 'name email').exec();
    }
    if (!userId) return spaces;

    // 1. Smart Recommendations: recommendation weight based on matching user skills
    let userSkills: string[] = [];
    const activeRoadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (activeRoadmap) {
      userSkills.push(activeRoadmap.targetRole || '');
      activeRoadmap.modules.forEach((m) => {
        userSkills.push(m.title);
        userSkills.push(...m.topics);
      });
    }

    const cv = await this.cvModel.findOne({ userId: new Types.ObjectId(userId) });
    if (cv && cv.skills) {
      userSkills.push(...cv.skills);
    }

    const cleanSkills = userSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

    return spaces.map((space) => {
      const spaceObj = space.toObject();
      let matchCount = 0;

      // Count matches between space skills/name and userSkills
      if (space.name) {
        const nameLower = space.name.toLowerCase();
        if (cleanSkills.some((s) => nameLower.includes(s) || s.includes(nameLower))) {
          matchCount += 3; // high weight on name match
        }
      }

      if (space.skills) {
        space.skills.forEach((skill) => {
          const sLower = skill.toLowerCase();
          if (cleanSkills.some((s) => sLower.includes(s) || s.includes(sLower))) {
            matchCount += 1;
          }
        });
      }

      return {
        ...spaceObj,
        recommended: matchCount > 0,
        matchScore: matchCount,
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  // ───────────────────────────── Posts ─────────────────────────────

  async createPost(spaceId: string, dto: CreatePostDto, userId: string): Promise<Post> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) {
      throw new NotFoundException(`Discussion space not found`);
    }

    const post = new this.postModel({
      ...dto,
      spaceId: new Types.ObjectId(spaceId),
      authorId: new Types.ObjectId(userId),
      upvotes: [userId],
      qualityScore: 1,
    });
    return post.save();
  }

  async findPostsBySpace(spaceId: string): Promise<Post[]> {
    const posts = await this.postModel
      .find({ spaceId: new Types.ObjectId(spaceId) })
      .populate('authorId', 'name email avatarUrl role')
      .sort({ createdAt: -1 })
      .exec();
    // Guard against posts whose author account was deleted (dangling ref).
    return posts.filter((p) => p.authorId);
  }

  async findPostById(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).populate('authorId', 'name email avatarUrl role');
    if (!post) {
      throw new NotFoundException(`Post not found`);
    }
    return post;
  }

  async votePost(id: string, userId: string, direction: 'up' | 'down'): Promise<Post> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException(`Post not found`);
    }

    const hadUpvote = post.upvotes.includes(userId);
    const hadDownvote = post.downvotes.includes(userId);

    post.upvotes = post.upvotes.filter((uid) => uid !== userId);
    post.downvotes = post.downvotes.filter((uid) => uid !== userId);

    // Toggle off if the user clicks the same direction they already voted;
    // otherwise apply (or switch to) the new direction.
    if (direction === 'up' && !hadUpvote) {
      post.upvotes.push(userId);
    } else if (direction === 'down' && !hadDownvote) {
      post.downvotes.push(userId);
    }

    post.qualityScore = post.upvotes.length - post.downvotes.length;
    return post.save();
  }

  // ───────────────────────────── Comments ─────────────────────────────

  async createComment(postId: string, dto: CreateCommentDto, userId: string): Promise<Comment> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post not found`);
    }

    const comment = new this.commentModel({
      ...dto,
      postId: new Types.ObjectId(postId),
      authorId: new Types.ObjectId(userId),
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      upvotes: [userId],
    });
    return comment.save();
  }

  async findCommentsByPost(postId: string): Promise<Comment[]> {
    const comments = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('authorId', 'name email avatarUrl role')
      .sort({ createdAt: 1 })
      .exec();
    return comments.filter((c) => c.authorId);
  }

  // ───────────────────────────── Moderation Reports ─────────────────────────────

  async createReport(dto: CreateReportDto, userId: string): Promise<Report> {
    this.logger.log(`Content reported by ${userId}: [${dto.contentType}] ${dto.contentId}`);
    const report = new this.reportModel({
      ...dto,
      reportedBy: new Types.ObjectId(userId),
      status: 'pending',
    });
    return report.save();
  }
}
