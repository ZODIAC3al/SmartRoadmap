import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @IsEnum(['resolved', 'dismissed'])
  status!: 'resolved' | 'dismissed';

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  resolution!: string;
}
