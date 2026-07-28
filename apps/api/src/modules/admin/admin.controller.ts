import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ResolveReportDto } from './dto/admin.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() admin: JwtUser,
    @Param('id') id: string,
    @Body('role') role: 'learner' | 'company' | 'admin' | 'mentor',
  ) {
    const user = await this.adminService.updateUserRole(id, role, admin.sub);
    return user;
  }

  @Post('users')
  createUser(@CurrentUser() admin: JwtUser, @Body() dto: any) {
    return this.adminService.createUser(dto, admin.sub);
  }

  @Put('users/:id')
  updateUser(@CurrentUser() admin: JwtUser, @Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateUser(id, dto, admin.sub);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.adminService.deleteUser(id, admin.sub);
  }

  @Get('reports')
  getReports(@Query('status') status?: string) {
    return this.adminService.getReports(status);
  }

  @Patch('reports/:id/resolve')
  resolveReport(@CurrentUser() admin: JwtUser, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto, admin.sub);
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('analytics/insights')
  getAIInsights() {
    return this.adminService.getAIInsights();
  }
}
