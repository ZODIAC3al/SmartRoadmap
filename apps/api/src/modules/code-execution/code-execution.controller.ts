import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CodeExecutionService } from './code-execution.service';
import { RunCodeDto } from './dto/run-code.dto';

@ApiTags('code-execution')
@ApiBearerAuth()
@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // Enforce strict rate limit: max 10 runs per minute
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runAdHocCode(@Body() dto: RunCodeDto) {
    const result = await this.codeExecutionService.runCode(
      dto.language,
      dto.code,
      dto.stdin || '',
    );
    return {
      success: true,
      data: result,
    };
  }
}
