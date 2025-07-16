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
    id: 'prod_SdbGhMJ8WLmUeQ',
    priceId: 'price_1RiK45LPohnizGblGB41isNm',
    name: 'Test Plan',
    description: 'Test subscription for FilePilot',
    mode: 'subscription',
    price: '€0.00',
    currency: 'eur',
    interval: 'month',
    features: [
      'Full access to all features',
      'Email attachment monitoring',
      'Google Drive integration',
      'AI-powered categorization',
      'Basic support'
    ]
  },
  {
    id: 'prod_SdVQdA76aEgPWS',
    priceId: 'price_1RiEPsLPohnizGbllcm2UZCw',
    name: 'FilePilot Annual',
    description: 'Annual subscription to FilePilot',
    mode: 'subscription',
    price: '€34.99',
    currency: 'eur',
    interval: 'year',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Smart search & filters',
      'Priority support',
      'API access',
      'Custom folder structures',
      'Advanced analytics'
    ]
  }
];

// Debug function to log current configuration
export function debugStripeConfig() {
  console.log('Current Stripe Configuration:', {
    products: stripeProducts.map(p => ({
      name: p.name,
      priceId: p.priceId,
      price: p.price,
      interval: p.interval
    }))
  });
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}