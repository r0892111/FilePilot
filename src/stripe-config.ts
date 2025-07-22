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

    cachedProducts = data.products || [];
    lastFetchTime = Date.now();
    
    return cachedProducts;
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    
    // Fallback to hardcoded products if API fails
    return getFallbackProducts();
  }
};

// Fallback products in case API fails
const getFallbackProducts = (): StripeProduct[] => {
  return [
    {
      id: 'filepilot-monthly',
      priceId: 'price_1RiK45LPohnizGblGB41isNm',
      name: 'FilePilot Monthly',
      price: '€0.00',
      interval: 'month',
      mode: 'subscription',
      description: 'Test plan for getting started with automated document organization',
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
      id: 'filepilot-annual',
      priceId: 'price_1RiEPsLPohnizGbllcm2UZCw',
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
};

// For backward compatibility
export const stripeProducts = getFallbackProducts();