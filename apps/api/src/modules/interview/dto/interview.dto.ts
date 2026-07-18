import { IsEnum, IsInt, IsOptional, IsString, Min, Max, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export enum InterviewTypeDto {
  Technical = 'technical',
  Behavioral = 'behavioral',
  Mixed = 'mixed',
}

export enum InterviewDifficultyDto {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Adaptive = 'adaptive',
}

export enum InterviewLanguageDto {
  EN = 'en',
  AR = 'ar',
  Mixed = 'mixed',
}

export enum InterviewModeDto {
  Text = 'text',
  Voice = 'voice',
}

export class StartInterviewDto {
  @IsEnum(InterviewTypeDto)
  type!: InterviewTypeDto;

  @IsEnum(InterviewDifficultyDto)
  difficulty!: InterviewDifficultyDto;

  @IsInt()
  @Min(5)
  @Max(180)
  durationMinutes!: number;

  @IsEnum(InterviewLanguageDto)
  language!: InterviewLanguageDto;

  @IsEnum(InterviewModeDto)
  mode!: InterviewModeDto;

  @IsOptional()
  @IsString()
  roadmapId?: string; // optional, defaults to user's current roadmap
}

export class SubmitInterviewAnswerDto {
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  answer?: string; // empty string allowed for skipped questions

  @IsInt()
  @Min(0)
  timeTaken!: number; // seconds

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  skipped?: boolean;
}
