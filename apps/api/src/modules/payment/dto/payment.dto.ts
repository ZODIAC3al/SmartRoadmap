import { IsIn, IsString, MaxLength } from 'class-validator';

export const PLAN_PRICES: Record<'pro_learner' | 'company_tier', number> = {
  pro_learner: 19.99,
  company_tier: 99.99,
};

export class CreateOrderDto {
  // The price is resolved SERVER-side from this plan — the client never sends an amount.
  @IsIn(['pro_learner', 'company_tier'])
  plan!: 'pro_learner' | 'company_tier';
}

export class CaptureOrderDto {
  @IsString()
  @MaxLength(64)
  orderId!: string;
}
