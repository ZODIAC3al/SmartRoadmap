import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
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
  constructor(
    private readonly certificationExportService: CertificationExportService,
  ) {}

  @Get('certification/:trackId')
  @ApiOperation({
    summary:
      'Export formal certification & achievement credential metadata for a learning track',
  })
  async getCertificationExport(
    @Param('trackId') trackId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<CertificationExportPayload> {
    return this.certificationExportService.generateCertificationExport(
      user.sub,
      trackId,
    );
  }

  @Get('certification/:trackId/pdf-html')
  @ApiOperation({
    summary:
      'Returns a fully-styled HTML page for browser print-to-PDF certification export',
  })
  async getCertificationHtml(
    @Param('trackId') trackId: string,
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ): Promise<void> {
    const html = await this.certificationExportService.generateCertificateHtml(
      user.sub,
      trackId,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  }

  @Get('my-certifications')
  @ApiOperation({
    summary:
      'Returns all track certifications issued to the authenticated user',
  })
  async getMyCertifications(@CurrentUser() user: JwtUser) {
    return this.certificationExportService.getUserCertifications(user.sub);
  }
}
