import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** One GitHub repository the user chose to import as a portfolio project. */
export class GitHubRepoItemDto {
  @IsInt()
  repoId!: number;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Repository URL must be a valid URL' })
  url?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Homepage URL must be a valid URL' })
  homepage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  topics?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stars?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  forks?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  readmeSnippet?: string;

  @IsOptional()
  @Type(() => Object)
  languages?: Record<string, number>;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class ImportGitHubReposDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GitHubRepoItemDto)
  @ArrayMaxSize(200)
  repos!: GitHubRepoItemDto[];
}

/** Full LinkedIn profile supplied through the manual / PDF alternative flow. */
export class ManualLinkedInDto {
  @IsOptional() @IsString() @MaxLength(200) fullName?: string;
  @IsOptional() @IsString() @MaxLength(200) headline?: string;
  @IsOptional() @IsString() @MaxLength(5000) about?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedInExperienceItemDto)
  experience?: LinkedInExperienceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedInEducationItemDto)
  education?: LinkedInEducationItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedInCertificationItemDto)
  certifications?: LinkedInCertificationItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  languages?: string[];
}

export class LinkedInExperienceItemDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) company?: string;
  @IsOptional() @IsString() @MaxLength(40) startDate?: string;
  @IsOptional() @IsString() @MaxLength(40) endDate?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class LinkedInEducationItemDto {
  @IsOptional() @IsString() @MaxLength(200) school?: string;
  @IsOptional() @IsString() @MaxLength(200) degree?: string;
  @IsOptional() @IsString() @MaxLength(200) fieldOfStudy?: string;
  @IsOptional() @IsString() @MaxLength(40) startDate?: string;
  @IsOptional() @IsString() @MaxLength(40) endDate?: string;
}

export class LinkedInCertificationItemDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) authority?: string;
  @IsOptional() @IsString() @MaxLength(40) issueDate?: string;
  @IsOptional() @IsString() @MaxLength(40) expirationDate?: string;
  @IsOptional() @IsString() @MaxLength(200) credentialId?: string;
  @IsOptional() @IsString() @MaxLength(500) credentialUrl?: string;
}

/** Fields submitted alongside a certificate file upload (multipart). */
export class CertificateUploadDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(200) organization?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expirationDate?: string;
  @IsOptional() @IsString() @MaxLength(200) credentialId?: string;
  @IsOptional()
  @IsUrl({}, { message: 'Credential URL must be a valid URL' })
  credentialUrl?: string;
}

/** Editable certificate metadata. */
export class UpdateCertificateDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) organization?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expirationDate?: string;
  @IsOptional() @IsString() @MaxLength(200) credentialId?: string;
  @IsOptional()
  @IsUrl({}, { message: 'Credential URL must be a valid URL' })
  credentialUrl?: string;
}

/** Editable imported project fields. */
export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional()
  @IsUrl({}, { message: 'Demo link must be a valid URL' })
  demoLink?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  technologies?: string[];
  @IsOptional() @IsDateString() lastUpdated?: string;
}
