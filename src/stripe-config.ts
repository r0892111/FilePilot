export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  interval?: 'month' | 'year';
  features: string[];
  isRecommended?: boolean;
  isFree?: boolean;
}

export const planConfigs: PlanConfig[] = [
  {
    id: 'free-plan',
    name: 'Free Plan',
    description: 'Get started with basic document organization',
    price: '€0.00',
    currency: 'eur',
    interval: 'month',
    features: [
      'Basic email attachment monitoring',
      'Google Drive integration',
      'AI-powered categorization',
      'Up to 100 documents/month',
      'Basic support'
    ],
    isFree: true
  },
  {
    id: 'pro-plan',
    name: 'Pro Plan',
    description: 'Complete document organization solution for professionals',
    price: '€9.99',
    currency: 'eur',
    interval: 'month',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Smart search & filters',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics'
    ],
    isRecommended: true
  },
  {
    id: 'annual-plan',
    name: 'Annual Plan',
    description: 'Best value - Save 20% with annual billing',
    price: '€99.99',
    currency: 'eur',
    interval: 'year',
    features: [
      'Everything in Pro Plan',
      'Save 20% with annual billing',
      'Priority customer support',
      'Early access to new features',
      'Advanced integrations',
      'Custom workflows',
      'Dedicated account manager'
    ]
  }
];

// Debug function to log current configuration
export function debugPlanConfig() {
  console.log('Current Plan Configuration:', {
    plans: planConfigs.map(p => ({
      name: p.name,
      price: p.price,
      interval: p.interval
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