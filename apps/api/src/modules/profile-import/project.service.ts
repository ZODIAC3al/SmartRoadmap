import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { UpdateProjectDto } from './dto/profile-import.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  private toUserObjectId(userId: string | Types.ObjectId): Types.ObjectId {
    return Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : (userId as any);
  }

  list(userId: string): Promise<Project[]> {
    const userObjectId = this.toUserObjectId(userId);
    return this.projectModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const userObjectId = this.toUserObjectId(userId);
    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.demoLink !== undefined) update.demoLink = dto.demoLink;
    if (dto.technologies !== undefined) update.technologies = dto.technologies;
    if (dto.lastUpdated !== undefined)
      update.lastUpdated = new Date(dto.lastUpdated);

    const project = await this.projectModel.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      update,
      {
        new: true,
      },
    );
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  async remove(userId: string, id: string): Promise<void> {
    const userObjectId = this.toUserObjectId(userId);
    const result = await this.projectModel.deleteOne({
      _id: id,
      userId: userObjectId,
    });
    if (result.deletedCount === 0)
      throw new NotFoundException('Project not found.');
  }
}
