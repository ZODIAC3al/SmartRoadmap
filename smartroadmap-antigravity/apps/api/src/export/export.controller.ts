import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { CertificationExportService } from './certification-export.service';
import type { CertificationExportPayload } from './certification-export.service';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly certificationExportService: CertificationExportService) {}

  @Get('certification/:trackId')
  @ApiOperation({ summary: 'Export formal certification & achievement credential metadata for a learning track' })
  async getCertificationExport(
    @Param('trackId') trackId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<CertificationExportPayload> {
    return this.certificationExportService.generateCertificationExport(user.sub, trackId);
  }
}
