import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoadmapService } from './roadmap.service';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { assertSelfOrAdmin } from '../../common/guards/ownership.util';
import {
  ExtendRoadmapDto,
  GenerateRoadmapDto,
  UpdateModuleStatusDto,
} from './dto/roadmap.dto';

@ApiTags('roadmap')
@ApiBearerAuth()
@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@CurrentUser() user: JwtUser, @Body() dto: GenerateRoadmapDto) {
    return this.roadmapService.generateRoadmap(
      user.sub,
      dto.targetRole,
      dto.skills ?? [],
    );
  }

  /** Kept for backwards compatibility, but the id is now authorization-checked. */
  @Get('user/:userId')
  getActive(@CurrentUser() user: JwtUser, @Param('userId') userId: string) {
    assertSelfOrAdmin(user, userId);
    return this.roadmapService.getActiveRoadmap(userId);
  }

  @Get('me')
  getMine(@CurrentUser() user: JwtUser) {
    return this.roadmapService.getActiveRoadmap(user.sub);
  }

  @Get(':id')
  getById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.getRoadmapById(id, user);
  }

  @Get(':id/progress')
  getProgress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.getRoadmapProgress(id, user);
  }

  @Patch(':id/modules/:mid')
  updateModule(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('mid') mid: string,
    @Body() dto: UpdateModuleStatusDto,
  ) {
    return this.roadmapService.updateModuleStatus(id, mid, dto.status, user);
  }

  @Post(':id/extend')
  extend(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ExtendRoadmapDto,
  ) {
    return this.roadmapService.extendRoadmap(id, dto.skills, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.roadmapService.deleteRoadmap(id, user);
  }
}
