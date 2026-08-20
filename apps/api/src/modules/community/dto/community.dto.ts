import {
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isArticle?: boolean;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateReportDto {
  @IsEnum(['post', 'comment', 'resource', 'mentor_profile'])
  contentType!: 'post' | 'comment' | 'resource' | 'mentor_profile';

  @IsString()
  contentId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
