import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { AddNoteDto, RateCandidateDto, UpdateStageDto } from './dto/pipeline.dto';

@ApiTags('pipeline')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('company', 'admin')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('job/:jobId')
  getPipelineForJob(
    @CurrentUser() user: JwtUser,
    @Param('jobId') jobId: string,
  ) {
    return this.pipelineService.getPipelineForJob(jobId, user);
  }

  @Patch(':id/stage')
  updateStage(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelineService.updateStage(id, user, dto.stage);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.OK)
  addNote(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.pipelineService.addNote(id, user, dto.text);
  }

  @Patch(':id/rating')
  rateCandidate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RateCandidateDto,
  ) {
    return this.pipelineService.rateCandidate(id, user, dto.rating);
  }
}
