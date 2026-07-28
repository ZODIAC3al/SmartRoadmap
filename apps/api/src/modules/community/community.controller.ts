import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateSpaceDto, CreatePostDto, CreateCommentDto, CreateReportDto } from './dto/community.dto';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('community')
@ApiBearerAuth()
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('spaces')
  getSpaces(@CurrentUser() user?: JwtUser) {
    return this.communityService.findAllSpaces(user?.sub);
  }

  @Post('spaces')
  createSpace(@CurrentUser() user: JwtUser, @Body() dto: CreateSpaceDto) {
    return this.communityService.createSpace(dto, user.sub);
  }

  @Get('spaces/:spaceId/posts')
  getPosts(@Param('spaceId') spaceId: string) {
    return this.communityService.findPostsBySpace(spaceId);
  }

  @Post('spaces/:spaceId/posts')
  createPost(
    @CurrentUser() user: JwtUser,
    @Param('spaceId') spaceId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.communityService.createPost(spaceId, dto, user.sub);
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.communityService.findPostById(id);
  }

  @Patch('posts/:id/vote')
  votePost(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.communityService.votePost(id, user.sub, direction);
  }

  @Get('posts/:id/comments')
  getComments(@Param('id') id: string) {
    return this.communityService.findCommentsByPost(id);
  }

  @Post('posts/:id/comments')
  createComment(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(id, dto, user.sub);
  }

  @Post('report')
  reportContent(@CurrentUser() user: JwtUser, @Body() dto: CreateReportDto) {
    return this.communityService.createReport(dto, user.sub);
  }
}
