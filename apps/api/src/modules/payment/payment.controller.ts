import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/decorators/current-user.decorator';
import { CaptureOrderDto, CreateOrderDto } from './dto/payment.dto';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    // userId from the token — a user can no longer buy/capture on someone else's behalf.
    return this.paymentService.createOrder(user.sub, dto.plan);
  }

  @Post('orders/capture')
  @HttpCode(HttpStatus.OK)
  capture(@CurrentUser() user: JwtUser, @Body() dto: CaptureOrderDto) {
    return this.paymentService.capturePayment(dto.orderId, user.sub);
  }

  /** Signed by PayPal, verified server-side. This is the entitlement source of truth. */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Headers() headers: Record<string, string>, @Req() req: any) {
    return this.paymentService.handleWebhook(headers, req.body);
  }
}
