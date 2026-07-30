import { IsEnum, IsString, IsUrl, MaxLength, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsUrl()
  url!: string;

  @IsEnum(['course', 'article', 'documentation', 'video', 'book', 'tutorial'])
  type!: 'course' | 'article' | 'documentation' | 'video' | 'book' | 'tutorial';

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category!: string;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty!: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
