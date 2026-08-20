import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { GitHubService } from './github.service';
import { LinkedInService } from './linkedin.service';
import { CertificateService } from './certificate.service';
import { ProjectService } from './project.service';
import {
  CertificateUploadDto,
  ImportGitHubReposDto,
  ManualLinkedInDto,
  UpdateCertificateDto,
  UpdateProjectDto,
} from './dto/profile-import.dto';

const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

@ApiTags('profile-import')
@ApiBearerAuth()
@Controller('profile')
export class ProfileImportController {
  constructor(
    private readonly github: GitHubService,
    private readonly linkedin: LinkedInService,
    private readonly certificates: CertificateService,
    private readonly projects: ProjectService,
  ) {}

  // ───────────────────────────── GitHub ─────────────────────────────

  @Get('github/status')
  githubStatus() {
    return { configured: this.github.isConfigured() };
  }

  @Get('github/auth-url')
  async githubAuthUrl(@CurrentUser() user: JwtUser) {
    if (!this.github.isConfigured()) {
      return { configured: false, url: null };
    }
    return { configured: true, url: await this.github.buildAuthUrl(user.sub) };
  }

  @Public()
  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontend = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
      .split(',')[0]
      .trim();

    if (error) {
      const msg = encodeURIComponent(errorDescription || error);
      return res.redirect(
        `${frontend}/profile/import?github=error&message=${msg}`,
      );
    }
    if (!code || !state) {
      return res.redirect(
        `${frontend}/profile/import?github=error&message=Missing+code+or+state`,
      );
    }
    try {
      await this.github.handleCallback(code, state);
      return res.redirect(`${frontend}/profile/import?github=connected`);
    } catch (err: any) {
      const msg = encodeURIComponent(
        err?.message ?? 'GitHub connection failed',
      );
      return res.redirect(
        `${frontend}/profile/import?github=error&message=${msg}`,
      );
    }
  }

  @Get('github/account')
  async githubAccount(@CurrentUser() user: JwtUser) {
    const account = await this.github.getAccount(user.sub);
    return { connected: Boolean(account), account: account ?? null };
  }

  @Get('github/repos')
  async githubRepos(
    @CurrentUser() user: JwtUser,
    @Query('refresh') refresh?: string,
  ) {
    const forceRefresh = refresh === 'true' || refresh === '1';
    const result = await this.github.getRepositories(user.sub, forceRefresh);
    return {
      repos: result.repos,
      lastSyncedAt: result.lastSyncedAt,
      fromCache: result.fromCache,
    };
  }

  @Post('github/import')
  @HttpCode(HttpStatus.OK)
  async githubImport(
    @CurrentUser() user: JwtUser,
    @Body() dto: ImportGitHubReposDto,
  ) {
    return this.github.importRepositories(user.sub, dto.repos);
  }

  @Post('github/refresh')
  @HttpCode(HttpStatus.OK)
  async githubRefresh(@CurrentUser() user: JwtUser) {
    const account = await this.github.refreshAccount(user.sub);
    return { success: true, account };
  }

  @Delete('github/disconnect')
  @HttpCode(HttpStatus.OK)
  async githubDisconnect(@CurrentUser() user: JwtUser) {
    await this.github.disconnect(user.sub);
    return { success: true };
  }

  // ─────────────────────────── LinkedIn ─────────────────────────────

  @Get('linkedin/account')
  async linkedinAccount(@CurrentUser() user: JwtUser) {
    const account = await this.linkedin.getAccount(user.sub);
    return { connected: Boolean(account), account: account ?? null };
  }

  @Post('linkedin/import')
  @HttpCode(HttpStatus.OK)
  async linkedinImport(
    @CurrentUser() user: JwtUser,
    @Body() dto: ManualLinkedInDto,
  ) {
    return this.linkedin.saveManualProfile(user.sub, dto);
  }

  @Post('linkedin/import-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES, files: 1 },
      fileFilter: (_req, file, cb) =>
        file.mimetype === 'application/pdf'
          ? cb(null, true)
          : cb(
              new BadRequestException(
                'Only PDF LinkedIn profiles are supported.',
              ),
              false,
            ),
    }),
  )
  async linkedinImportPdf(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No PDF file provided.');
    }
    return this.linkedin.importPdf(user.sub, file.buffer);
  }

  // ────────────────────────── Certificates ──────────────────────────

  @Post('certificates')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        return allowed.includes(file.mimetype)
          ? cb(null, true)
          : cb(
              new BadRequestException(
                'Unsupported file format. Allowed: PDF, JPG, JPEG, PNG.',
              ),
              false,
            );
      },
    }),
  )
  async uploadCertificate(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() fields: CertificateUploadDto,
  ) {
    return this.certificates.upload(user.sub, file, fields);
  }

  @Get('certificates')
  async listCertificates(@CurrentUser() user: JwtUser) {
    return { certificates: await this.certificates.list(user.sub) };
  }

  @Patch('certificates/:id')
  @HttpCode(HttpStatus.OK)
  async updateCertificate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
  ) {
    return this.certificates.update(user.sub, id, dto);
  }

  @Delete('certificates/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCertificate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    await this.certificates.remove(user.sub, id);
    return { success: true };
  }

  @Get('certificates/:id/file')
  async certificateFile(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const url = await this.certificates.getFileUrl(user.sub, id);
    if (download === '1' || download === 'true') {
      res.setHeader('Content-Disposition', 'attachment');
    }
    return res.redirect(url);
  }

  // ──────────────────────────── Projects ────────────────────────────

  @Get('projects')
  async listProjects(@CurrentUser() user: JwtUser) {
    return { projects: await this.projects.list(user.sub) };
  }

  @Patch('projects/:id')
  @HttpCode(HttpStatus.OK)
  async updateProject(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user.sub, id, dto);
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.OK)
  async deleteProject(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.projects.remove(user.sub, id);
    return { success: true };
  }
}
