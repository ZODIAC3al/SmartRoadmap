import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { StartSessionDto, SubmitAnswerDto } from './dto/assessment.dto';

@ApiTags('assessment')
@ApiBearerAuth()
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  start(@CurrentUser() user: JwtUser, @Body() dto: StartSessionDto) {
    return this.assessmentService.startSession(
      user.sub,
      dto.moduleId,
      dto.topic,
    );
  }

  @Post('session/:id/answer')
  @HttpCode(HttpStatus.OK)
  answer(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    // Session ownership is enforced inside the service — you can't answer someone else's quiz.
    return this.assessmentService.submitAnswer(
      id,
      dto.answer,
      dto.timeTaken ?? 10,
      user,
    );
  }
}
