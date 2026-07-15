import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CodingChallengeService } from './coding-challenge.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('coding-challenges')
@ApiBearerAuth()
@Controller('coding-challenges')
export class CodingChallengeController {
  constructor(private readonly challengeService: CodingChallengeService) {}

  @Get()
  async getChallenges(
    @CurrentUser() user: JwtUser,
    @Query('moduleId') moduleId?: string,
  ) {
    const list = await this.challengeService.getChallenges(moduleId, user.sub);
    return {
      success: true,
      data: list,
    };
  }

  @Get(':id')
  async getChallenge(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    const challenge = await this.challengeService.getChallengeById(id, user.sub);
    return {
      success: true,
      data: challenge,
    };
  }

  @Post(':id/submit')
  async submitCode(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: { language: string; code: string },
  ) {
    const submission = await this.challengeService.submitCode(
      user.sub,
      id,
      body.language,
      body.code,
    );
    return {
      success: true,
      data: submission,
    };
  }
}
