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

// Static product configuration based on your Stripe products
export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SjSgllnIS1gkRs',
    priceId: 'price_1RnzlbLPohnizGblMopmOjP0',
    name: 'testsubscription',
    price: '€0.00',
    interval: 'month',
    mode: 'subscription',
    description: 'test',
    features: [
      'Unlimited email processing',
      'AI-powered categorization',
      'Google Drive integration',
      'Email support',
      'Basic analytics',
      'Test subscription features'
    ]
  },
  {
    id: 'prod_SijXdzmu0toRPV',
    priceId: 'price_1RnI4jLPohnizGblTUXhsAK3',
    name: 'Filepilot Year',
    price: '€34.99',
    interval: 'year',
    mode: 'subscription',
    description: 'Annual subscription with full features and priority support',
    features: [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics',
      'Annual billing (save money)'
    ]
  }
];

// Cache for products to avoid repeated API calls
let cachedProducts: StripeProduct[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchStripeProducts = async (): Promise<StripeProduct[]> => {
  // Return cached products if still valid
  if (cachedProducts && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedProducts;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Use API products if available, otherwise fallback to static config
    cachedProducts = data.products && data.products.length > 0 ? data.products : stripeProducts;
    lastFetchTime = Date.now();
    
    return cachedProducts;
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    
    // Fallback to static products if API fails
    return stripeProducts;
  }
};