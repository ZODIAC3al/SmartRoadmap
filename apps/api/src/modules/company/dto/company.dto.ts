import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { CompanySize } from '../../../schemas/company.schema';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsEnum(['1-10', '11-50', '51-200', '201-1000', '1000+'])
  size?: CompanySize;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  about?: string;
}
