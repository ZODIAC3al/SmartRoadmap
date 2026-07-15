import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IsEmail } from 'class-validator';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

class SubscribeDto {
  @IsEmail()
  email!: string;
}

@ApiTags('system')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Liveness/readiness probe for the load balancer. */
  @Public()
  @Get('health')
  health() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = states[this.connection.readyState] ?? 'unknown';
    return {
      status: dbState === 'connected' ? 'ok' : 'degraded',
      db: dbState,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** The frontend footer called this endpoint — it never existed until now. */
  @Public()
  @Post('newsletter/subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeDto) {
    return this.appService.subscribeToNewsletter(dto.email);
  }
}
