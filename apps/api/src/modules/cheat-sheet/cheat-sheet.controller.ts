import { Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheatSheetService } from './cheat-sheet.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cheat-sheets')
@ApiBearerAuth()
@Controller('cheat-sheets')
export class CheatSheetController {
  constructor(private readonly cheatSheetService: CheatSheetService) {}

  /** GET /cheat-sheets/:moduleId — fetch current speech notes */
  @Get(':moduleId')
  async getCheatSheet(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const sheet = await this.cheatSheetService.get(user.sub, moduleId);
    if (!sheet) throw new NotFoundException('Speech notes not yet generated');
    return { success: true, data: sheet };
  }

  /** GET /cheat-sheets/:moduleId/history — fetch version history */
  @Get(':moduleId/history')
  async getHistory(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const history = await this.cheatSheetService.getHistory(user.sub, moduleId);
    return { success: true, data: history };
  }

  /** POST /cheat-sheets/:moduleId/generate — first-time AI generation */
  @Post(':moduleId/generate')
  async generateCheatSheet(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const sheet = await this.cheatSheetService.generate(user.sub, moduleId);
    return { success: true, data: sheet };
  }

  /** POST /cheat-sheets/:moduleId/regenerate — generate a NEW version, archive the old one */
  @Post(':moduleId/regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateCheatSheet(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const sheet = await this.cheatSheetService.regenerate(user.sub, moduleId);
    return { success: true, data: sheet };
  }
}
