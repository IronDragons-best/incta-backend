import { ApiProperty } from '@nestjs/swagger';
import { PlanType, SubscriptionPlan } from '@common';

export class SubscriptionPlanViewDto {
  constructor(plan: SubscriptionPlan, planType: PlanType, price: number) {
    this.plan = plan;
    this.planType = planType;
    this.price = price;
  }

  @ApiProperty({ default: SubscriptionPlan.Business })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: PlanType, default: PlanType.MONTHLY })
  planType: PlanType;

  @ApiProperty({ default: 2.49 })
  price: number;
}

export class PagedSubscriptionPlansViewDto {
  @ApiProperty({
    type: () => [SubscriptionPlanViewDto],
    description: 'Array of Subscription plans',
  })
  plans: SubscriptionPlanViewDto[];

  @ApiProperty({ default: SubscriptionPlan.Personal })
  currentPlan: SubscriptionPlan;

  static mapToView(plans: SubscriptionPlanViewDto[], currentPlan: SubscriptionPlan) {
    const viewDto = new PagedSubscriptionPlansViewDto();
    viewDto.plans = plans;
    viewDto.currentPlan = currentPlan;
    return viewDto;
  }
}
