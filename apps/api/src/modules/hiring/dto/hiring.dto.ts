import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
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
