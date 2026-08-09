import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileImportController } from './profile-import.controller';
import { GitHubService } from './github.service';
import { LinkedInService } from './linkedin.service';
import { CertificateService } from './certificate.service';
import { ProjectService } from './project.service';
import {
  GitHubAccount,
  GitHubAccountSchema,
} from '../../schemas/github-account.schema';
import {
  LinkedInAccount,
  LinkedInAccountSchema,
} from '../../schemas/linkedin-account.schema';
import {
  Certificate,
  CertificateSchema,
} from '../../schemas/certificate.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GitHubAccount.name, schema: GitHubAccountSchema },
      { name: LinkedInAccount.name, schema: LinkedInAccountSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    UploadModule,
  ],
  controllers: [ProfileImportController],
  providers: [
    GitHubService,
    LinkedInService,
    CertificateService,
    ProjectService,
  ],
  exports: [GitHubService, LinkedInService, CertificateService, ProjectService],
})
export class ProfileImportModule {}
