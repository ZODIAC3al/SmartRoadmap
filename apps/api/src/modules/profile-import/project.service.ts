import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { UpdateProjectDto } from './dto/profile-import.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  list(userId: string): Promise<Project[]> {
    return this.projectModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.demoLink !== undefined) update.demoLink = dto.demoLink;
    if (dto.technologies !== undefined) update.technologies = dto.technologies;
    if (dto.lastUpdated !== undefined)
      update.lastUpdated = new Date(dto.lastUpdated);

    const project = await this.projectModel.findOneAndUpdate(
      { _id: id, userId },
      update,
      {
        new: true,
      },
    );
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.projectModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0)
      throw new NotFoundException('Project not found.');
  }
}
