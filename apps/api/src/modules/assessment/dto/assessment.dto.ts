import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class StartSessionDto {
  @IsString() @MaxLength(80)
  moduleId!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  topic!: string;
}

export class SubmitAnswerDto {
  @IsString() @MaxLength(500)
  answer!: string;

  @IsOptional() @IsNumber() @Min(0) @Max(3600)
  timeTaken?: number;
}
