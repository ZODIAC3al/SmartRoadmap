import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { PipelineStage } from '../../../schemas/pipeline.schema';

export class UpdateStageDto {
  @IsEnum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])
  @IsNotEmpty()
  stage!: PipelineStage;
}

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}

export class RateCandidateDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
