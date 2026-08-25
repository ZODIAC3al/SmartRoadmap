import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { PlanTier } from '../../../schemas/subscription.schema';

export class CreateCheckoutSessionDto {
  @IsEnum(['learner_free', 'learner_pro', 'starter', 'growth', 'scale'])
  @IsNotEmpty()
  plan!: PlanTier;
}

export class BoostJobDto {
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
