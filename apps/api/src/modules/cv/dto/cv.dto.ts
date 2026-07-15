import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class EnhanceDto {
  @IsString() @MinLength(3) @MaxLength(2000)
  text!: string;
}

export class SaveCvDto {
  @IsObject()
  data!: Record<string, unknown>;
}
