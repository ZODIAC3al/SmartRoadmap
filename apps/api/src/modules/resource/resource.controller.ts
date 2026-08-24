import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/resource.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('resource')
@ApiBearerAuth()
@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Public()
  @Get('youtube-videos')
  @ApiOperation({ summary: 'Get top 5 educational YouTube videos for a topic' })
  @ApiQuery({ name: 'topic', required: false, description: 'Topic to search videos for' })
  getYouTubeVideos(@Query('topic') topic?: string) {
    return this.resourceService.getYouTubeVideos(topic || 'Software Engineering');
  }

  @Post()
  submit(@CurrentUser() user: JwtUser, @Body() dto: CreateResourceDto) {
    return this.resourceService.create(dto, user.sub);
  }

  @Get()
  list(
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.resourceService.findAll({ difficulty, category, type, search });
  }

  @Get('recommend')
  recommend(@CurrentUser() user: JwtUser) {
    return this.resourceService.getRecommendations(user.sub);
  }

  @Patch(':id/vote')
  vote(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.resourceService.vote(id, user.sub, direction);
  }
}
