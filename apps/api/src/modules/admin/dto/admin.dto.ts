import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResolveReportDto {
  @IsEnum(['resolved', 'dismissed'])
  status!: 'resolved' | 'dismissed';

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  resolution!: string;
}

export class VerifyCertificateDto {
  @IsEnum(['Verified', 'Rejected'])
  status!: 'Verified' | 'Rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
