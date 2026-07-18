// apps/api/src/modules/salary/dto/salary.dto.ts
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class PredictSalaryDto {
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  industry?: string;
}

export class UpdateCareerProfileDto {
  @IsString()
  @IsOptional()
  currentRole?: string;

  @IsString()
  @IsOptional()
  targetRole?: string;

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  industry?: string;
}
