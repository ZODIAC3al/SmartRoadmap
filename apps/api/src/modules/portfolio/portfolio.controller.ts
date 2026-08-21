import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('me')
  async getMine(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.portfolioService.getMyPortfolio(user.sub),
    };
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  async save(@CurrentUser() user: JwtUser, @Body() body: any) {
    return {
      success: true,
      data: await this.portfolioService.savePortfolio(user.sub, body),
    };
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  async publish(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.portfolioService.setPublishStatus(user.sub, true),
    };
  }

  @Post('unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublish(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.portfolioService.setPublishStatus(user.sub, false),
    };
  }

  @Public()
  @Get('public/:username')
  async getPublic(@Param('username') username: string) {
    return {
      success: true,
      data: await this.portfolioService.getPublicPortfolio(username),
    };
  }
}
