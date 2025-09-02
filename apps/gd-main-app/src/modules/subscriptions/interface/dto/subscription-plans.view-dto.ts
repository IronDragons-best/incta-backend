import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@common';

export class SubscriptionPlanViewDto {
  constructor(plan: SubscriptionPlan, price: number) {
    this.plan = plan;
    this.price = price;
  }
  @ApiProperty({ default: SubscriptionPlan.Business })
  plan: SubscriptionPlan;

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

    viewDto.plans = plans.map((p) => {
      return {
        plan: p.plan,
        price: p.price,
      };
    });
    viewDto.currentPlan = currentPlan;

    return viewDto;
  }
}
