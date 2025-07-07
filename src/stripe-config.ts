export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
  currency: string;
  interval?: 'month' | 'year';
  features: string[];
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'monthly-plan',
    priceId: 'price_1RiEOYLPohnizGblQ49d7L7c', // Monthly plan price ID
    name: 'Monthly Plan',
    description: 'Monthly subscription to FilePilot',
    mode: 'subscription',
    price: '€3.49',
    currency: 'eur',
    interval: 'month',
    features: [
      '1,000 emails per month',
      'Automatic categorization',
      'Google Drive integration',
      'Basic search functionality',
      'Email support'
    ]
  },
  {
    id: 'yearly-plan',
    priceId: 'price_1RiEPsLPohnizGbllcm2UZCw', // Yearly plan price ID
    name: 'Yearly Plan',
    description: 'Yearly subscription to FilePilot',
    mode: 'subscription',
    price: '€34.99',
    currency: 'eur',
    interval: 'year',
    features: [
      'Unlimited emails',
      'Advanced AI categorization',
      'Google Drive integration',
      'Smart search & filters',
      'Priority support',
      'API access'
    ]
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}