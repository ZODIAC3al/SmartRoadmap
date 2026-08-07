import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RunCodeDto {
  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  code!: string;

  @IsOptional()
  @IsString()
  stdin?: string;
}
