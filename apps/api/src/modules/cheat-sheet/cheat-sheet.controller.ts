import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheatSheetService } from './cheat-sheet.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cheat-sheets')
@ApiBearerAuth()
@Controller('cheat-sheets')
export class CheatSheetController {
  constructor(private readonly cheatSheetService: CheatSheetService) {}

  @Get(':moduleId')
  async getCheatSheet(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const sheet = await this.cheatSheetService.get(user.sub, moduleId);
    if (!sheet) {
      throw new NotFoundException('Cheat sheet not yet generated');
    }
    return {
      success: true,
      data: sheet,
    };
  }

  @Post(':moduleId/generate')
  async generateCheatSheet(@CurrentUser() user: JwtUser, @Param('moduleId') moduleId: string) {
    const sheet = await this.cheatSheetService.generate(user.sub, moduleId);
    return {
      success: true,
      data: sheet,
    };
  }
}
