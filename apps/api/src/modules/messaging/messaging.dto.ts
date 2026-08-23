import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { ThreadContext } from '../../schemas/message-thread.schema';

export class CreateThreadDto {
  @IsMongoId({ message: 'otherUserId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  otherUserId!: string;

  @IsOptional()
  @IsString()
  context?: ThreadContext;

  @IsOptional()
  @IsMongoId()
  relatedJobId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  initialMessage?: string;
}

export class SendMessageDto {
  @IsMongoId({ message: 'threadId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  threadId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  attachmentSize?: number;

  @IsOptional()
  @IsString()
  clientNonce?: string;
}
