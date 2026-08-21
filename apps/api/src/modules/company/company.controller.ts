import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto } from './dto/company.dto';

@ApiTags('company')
@Controller()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Get('company/overview')
  getOverview(@CurrentUser() user: JwtUser) {
    return this.companyService.getOverviewData(user);
  }

  @Public()
  @Get('companies/:slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.companyService.getCompanyBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Get('company/:id')
  getCompany(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.companyService.getCompanyById(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Patch('company/:id')
  updateCompany(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(id, user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('company/:id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.companyService.uploadLogo(id, user, file);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('company', 'admin')
  @Post('company/:id/cover')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadCover(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.companyService.uploadCover(id, user, file);
  }
}
