export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  price: string;
  interval?: 'month' | 'year';
  mode: 'payment' | 'subscription';
  features: string[];
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SdbGhMJ8WLmUeQ',
    priceId: 'price_1RiK45LPohnizGblGB41isNm',
    name: 'Test Plan',
    price: '€0.00',
    interval: 'month',
    mode: 'subscription',
    features: [
      'Test all features',
      'Email monitoring',
      'Basic organization',
      'Community support'
    ]
  },
  {
    id: 'prod_SdVQdA76aEgPWS',
    priceId: 'price_1RiEPsLPohnizGbllcm2UZCw',
    name: 'FilePilot Annual',
    price: '€34.99',
    interval: 'year',
    mode: 'subscription',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics',
      'Annual billing discount'
    ]
  }
];