import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CodeDraftService } from './code-draft.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('code-drafts')
@ApiBearerAuth()
@Controller('code-drafts')
export class CodeDraftController {
  constructor(private readonly draftService: CodeDraftService) {}

  @Get()
  async getDraft(
    @CurrentUser() user: JwtUser,
    @Query('challengeId') challengeId?: string,
  ) {
    const id = challengeId && challengeId !== 'null' ? challengeId : null;
    const draft = await this.draftService.getDraft(user.sub, id);
    return {
      success: true,
      data: draft,
    };
  }

  @Put()
  async saveDraft(
    @CurrentUser() user: JwtUser,
    @Body() body: { challengeId?: string | null; language: string; code: string; title?: string },
  ) {
    const id = body.challengeId || null;
    const draft = await this.draftService.saveDraft(
      user.sub,
      id,
      body.language,
      body.code,
      body.title,
    );
    return {
      success: true,
      data: draft,
    };
  }
}
