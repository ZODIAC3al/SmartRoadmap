import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApplicantPipeline, PipelineStage } from '../../schemas/pipeline.schema';
import { Job } from '../../schemas/job.schema';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PipelineService {
  constructor(
    @InjectModel(ApplicantPipeline.name)
    private readonly pipelineModel: Model<ApplicantPipeline>,
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
  ) {}

  async getPipelineForJob(
    jobId: string,
    user: JwtUser,
  ): Promise<Record<PipelineStage, ApplicantPipeline[]>> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid Job ID');
    }

    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const items = await this.pipelineModel
      .find({ jobId: new Types.ObjectId(jobId) })
      .populate('candidateId', 'name email avatarUrl role')
      .populate('notes.authorId', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    const stages: Record<PipelineStage, ApplicantPipeline[]> = {
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    };

    for (const item of items) {
      const stage = item.stage || 'applied';
      if (stages[stage]) {
        stages[stage].push(item);
      } else {
        stages.applied.push(item);
      }
    }

    return stages;
  }

  async updateStage(
    id: string,
    user: JwtUser,
    newStage: PipelineStage,
  ): Promise<ApplicantPipeline> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Pipeline ID');
    }

    const pipeline = await this.pipelineModel.findById(id);
    if (!pipeline) {
      throw new NotFoundException('Applicant pipeline record not found');
    }

    const oldStage = pipeline.stage;
    pipeline.stage = newStage;
    if (!pipeline.stageHistory) pipeline.stageHistory = [];

    pipeline.stageHistory.push({
      stage: newStage,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(user.sub),
    });

    await pipeline.save();
    return this.pipelineModel
      .findById(id)
      .populate('candidateId', 'name email avatarUrl role')
      .populate('notes.authorId', 'name email')
      .exec() as Promise<ApplicantPipeline>;
  }

  async addNote(
    id: string,
    user: JwtUser,
    text: string,
  ): Promise<ApplicantPipeline> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Pipeline ID');
    }

    const pipeline = await this.pipelineModel.findById(id);
    if (!pipeline) {
      throw new NotFoundException('Applicant pipeline record not found');
    }

    if (!pipeline.notes) pipeline.notes = [];
    pipeline.notes.push({
      authorId: new Types.ObjectId(user.sub),
      text: text.trim(),
      createdAt: new Date(),
    });

    await pipeline.save();
    return this.pipelineModel
      .findById(id)
      .populate('candidateId', 'name email avatarUrl role')
      .populate('notes.authorId', 'name email')
      .exec() as Promise<ApplicantPipeline>;
  }

  async rateCandidate(
    id: string,
    user: JwtUser,
    rating: number,
  ): Promise<ApplicantPipeline> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Pipeline ID');
    }

    const pipeline = await this.pipelineModel.findById(id);
    if (!pipeline) {
      throw new NotFoundException('Applicant pipeline record not found');
    }

    pipeline.rating = rating;
    await pipeline.save();

    return pipeline;
  }
}
