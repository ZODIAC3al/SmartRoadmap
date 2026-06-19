import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body('userId') userId: string,
    @Body('plan') plan: 'pro_learner' | 'company_tier',
  ) {
    return this.paymentService.createOrder(userId, plan);
  }

  @Post('orders/:id/capture')
  @HttpCode(HttpStatus.OK)
  async capturePayment(@Param('id') id: string) {
    return this.paymentService.capturePayment(id);
  }
}
