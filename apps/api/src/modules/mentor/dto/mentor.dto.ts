import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class CreateMentorProfileDto {
  @IsArray()
  @IsString({ each: true })
  expertise!: string[];

  @IsInt()
  @Min(0)
  experienceYears!: number;

  @IsString()
  industry!: string;

  @IsString()
  bio!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability!: AvailabilitySlotDto[];
}

export class BookSessionDto {
  @IsString()
  mentorId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSessionStatusDto {
  @IsEnum(['accepted', 'rejected', 'completed', 'cancelled'])
  status!: 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class RateMentorDto {
  @IsInt()
  @Min(1)
  @Max(5)
  quality!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  helpfulness!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  expertise!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  communication!: number;

  @IsOptional()
  @IsString()
  review?: string;
}
