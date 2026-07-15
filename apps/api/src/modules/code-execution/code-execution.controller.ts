import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CodeExecutionService } from './code-execution.service';

@ApiTags('code-execution')
@ApiBearerAuth()
@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // Enforce strict rate limit: max 10 runs per minute
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runAdHocCode(@Body() body: { language: string; code: string; stdin?: string }) {
    const result = await this.codeExecutionService.runCode(
      body.language,
      body.code,
      body.stdin || '',
    );
    return {
      success: true,
      data: result,
    };
  }
}
