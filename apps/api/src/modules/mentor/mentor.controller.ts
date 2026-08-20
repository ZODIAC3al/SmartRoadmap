import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MentorService } from './mentor.service';
import {
  CreateMentorProfileDto,
  BookSessionDto,
  UpdateSessionStatusDto,
  RateMentorDto,
} from './dto/mentor.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('mentor')
@ApiBearerAuth()
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Post('profiles')
  upsertProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMentorProfileDto,
  ) {
    return this.mentorService.upsertProfile(dto, user.sub);
  }

  @Get('profiles')
  listProfiles(@Query('search') search?: string) {
    return this.mentorService.findProfiles(search);
  }

  @Get('profiles/recommend')
  recommend(@CurrentUser() user: JwtUser) {
    return this.mentorService.recommendMentors(user.sub);
  }

  @Get('profiles/:id')
  getProfile(@Param('id') id: string) {
    return this.mentorService.getProfile(id);
  }

  @Post('sessions')
  bookSession(@CurrentUser() user: JwtUser, @Body() dto: BookSessionDto) {
    return this.mentorService.bookSession(dto, user.sub);
  }

  @Get('sessions/me')
  getSessions(@CurrentUser() user: JwtUser) {
    return this.mentorService.findSessions(user.sub, user.role);
  }

  @Patch('sessions/:id')
  updateSession(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
  ) {
    return this.mentorService.updateSessionStatus(id, dto, user.sub);
  }

  @Post('sessions/:id/rate')
  rateSession(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RateMentorDto,
  ) {
    return this.mentorService.rateMentor(id, dto, user.sub);
  }
}
