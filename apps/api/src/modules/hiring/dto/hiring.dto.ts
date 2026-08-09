import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  company!: string;

  @IsString()
  @MaxLength(120)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  country?: string;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  requiredSkills!: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  salaryMax?: number;

  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;
}

export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'hired';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'interested', 'applied', 'under_review', 'interview', 'rejected', 'offer', 'hired',
];

export class CreateApplicationDto {
  @IsString()
  jobId!: string;

  @IsString()
  jobTitle!: string;

  @IsString()
  company!: string;

  @IsOptional()
  @IsString()
  cvId?: string;

  @IsOptional()
  @IsString()
  cvTitle?: string;

  @IsOptional()
  @IsNumber()
  matchScore?: number;

  @IsOptional()
  @IsEnum(APPLICATION_STATUSES)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum(APPLICATION_STATUSES)
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
