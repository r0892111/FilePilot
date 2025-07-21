export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  price: string;
  interval?: 'month' | 'year';
  mode: 'payment' | 'subscription';
  features: string[];
  description: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SijYQtin4uF1B2',
    priceId: 'price_1RnI5VLPohnizGbliLa6FAbe',
    name: 'FilePilot Monthly',
    price: '€4.00',
    interval: 'month',
    mode: 'subscription',
    description: 'Perfect for getting started with automated document organization',
    features: [
      'Unlimited email processing',
      'AI-powered categorization',
      'Google Drive integration',
      'Email support',
      'Basic analytics',
      'Monthly billing'
    ]
  },
  {
    id: 'prod_SijXdzmu0toRPV',
    priceId: 'price_1RnI4jLPohnizGblTUXhsAK3',
    name: 'FilePilot Annual',
    price: '€34.99',
    interval: 'year',
    mode: 'subscription',
    description: 'Best value plan with all features and priority support',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics',
      'Annual billing (save 27%)'
    ]
  }
];