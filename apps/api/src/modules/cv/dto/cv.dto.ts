import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EnhanceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  text!: string;
}

export class SaveCvDto {
  @IsObject()
  data!: Record<string, unknown>;
}

export class GenerateTailoredCvDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  targetJobTitle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  jobDescription?: string;

  @IsOptional()
  @IsBoolean()
  includeProjects?: boolean;

  @IsOptional()
  @IsBoolean()
  includeCertificates?: boolean;

  @IsOptional()
  @IsObject()
  cvData?: Record<string, any>;
}

export class AtsCheckDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  targetJobTitle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  jobDescription?: string;

  @IsOptional()
  @IsObject()
  cvData?: Record<string, any>;
}

export class AtsAutoFixDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  targetJobTitle!: string;

  @IsArray()
  @IsString({ each: true })
  missingKeywords!: string[];

  @IsOptional()
  @IsObject()
  cvData?: Record<string, any>;
}

export class GenerateFromProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetJobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  jobDescription?: string;

  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;

  @IsOptional()
  @IsObject()
  cvData?: Record<string, any>;
}

