export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  price: string;
  priceId: string;
  currency: string;
  interval?: 'month' | 'year';
  mode: 'payment' | 'subscription';
  features: string[];
  isRecommended?: boolean;
  isFree?: boolean;
}

export const planConfigs: PlanConfig[] = [
  {
    id: 'testprod',
    name: 'Test Product',
    description: 'Test product for development',
    price: '€0.00',
    priceId: 'price_1RiK45LPohnizGblGB41isNm',
    currency: 'eur',
    mode: 'subscription',
    features: [
      'Test features',
      'Google Drive integration',
      'AI-powered categorization',
      'Basic support'
    ],
    isFree: true
  },
  {
    id: 'FilePilot-year',
    name: 'FilePilot Annual',
    description: 'Complete document organization solution - Annual plan',
    price: '€34.99',
    priceId: 'price_1RiEPsLPohnizGbllcm2UZCw',
    currency: 'eur',
    interval: 'year',
    mode: 'subscription',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Smart search & filters',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics',
      'Save with annual billing'
    ],
    isRecommended: true
  }
];

// Debug function to log current configuration
export function debugPlanConfig() {
  console.log('Current Plan Configuration:', {
    plans: planConfigs.map(p => ({
      name: p.name,
      price: p.price,
      interval: p.interval,
      priceId: p.priceId,
      mode: p.mode
    }))
  });
}

export function getPlanById(id: string): PlanConfig | undefined {
  return planConfigs.find(plan => plan.id === id);
}

export function getRecommendedPlan(): PlanConfig | undefined {
  return planConfigs.find(plan => plan.isRecommended);
}

export function getFreePlan(): PlanConfig | undefined {
  return planConfigs.find(plan => plan.isFree);
}