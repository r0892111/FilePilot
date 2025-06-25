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
    id: 'prod_SYLAWoGK4jr6Us',
    priceId: 'price_1RdEUUFzbUfm7BYRYrWGFeIX',
    name: 'Monthly Plan',
    description: 'Monthly recurring payment of 3.49',
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
    id: 'prod_SYLCKiifxqz0cE',
    priceId: 'price_1RdEVlFzbUfm7BYRWpZ2CXVR',
    name: 'Yearly Plan',
    description: 'Yearly recurring payment of 34.99',
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