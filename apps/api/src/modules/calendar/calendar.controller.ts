import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  async getEvents(@CurrentUser() user: JwtUser) {
    return {
      success: true,
      data: await this.calendarService.findAllForUser(user.sub),
    };
  }

  @Post('events')
  async createEvent(@CurrentUser() user: JwtUser, @Body() data: any) {
    return {
      success: true,
      data: await this.calendarService.create(user.sub, data),
    };
  }

  @Patch('events/:id')
  async updateEvent(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return {
      success: true,
      data: await this.calendarService.update(id, user.sub, data),
    };
  }

  @Delete('events/:id')
  async deleteEvent(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    const deleted = await this.calendarService.delete(id, user.sub);
    return { success: deleted };
  }

  @Post('auto-schedule')
  async autoSchedule(@CurrentUser() user: JwtUser) {
    const events = await this.calendarService.autoSchedule(user.sub);
    return {
      success: true,
      data: events,
    };
  }
}
