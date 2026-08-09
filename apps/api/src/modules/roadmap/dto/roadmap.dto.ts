import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateRoadmapDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  targetRole!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];
}

export class UpdateModuleStatusDto {
  @IsIn(['locked', 'in_progress', 'completed', 'failed'])
  status!: 'locked' | 'in_progress' | 'completed' | 'failed';
}

export class ExtendRoadmapDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skills!: string[];
}
