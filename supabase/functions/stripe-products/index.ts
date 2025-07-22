import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'FilePilot Integration',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  price: string;
  interval?: 'month' | 'year';
  mode: 'payment' | 'subscription';
  features: string[];
  description: string;
}

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Transform Stripe products to our format
    const transformedProducts: StripeProduct[] = [];

    for (const product of products.data) {
      const defaultPrice = product.default_price;
      
      if (!defaultPrice || typeof defaultPrice === 'string') {
        continue; // Skip products without expanded price data
      }

      // Determine if this is a subscription or one-time payment
      const isSubscription = defaultPrice.type === 'recurring';
      const interval = isSubscription ? defaultPrice.recurring?.interval : undefined;
      
      // Format price
      const amount = defaultPrice.unit_amount || 0;
      const currency = defaultPrice.currency || 'eur';
      const formattedPrice = `€${(amount / 100).toFixed(2)}`;

      // Generate features based on product metadata or use defaults
      const features = getProductFeatures(product.id, interval);
      
      transformedProducts.push({
        id: product.id,
        priceId: defaultPrice.id,
        name: product.name,
        price: formattedPrice,
        interval: interval as 'month' | 'year' | undefined,
        mode: isSubscription ? 'subscription' : 'payment',
        features,
        description: product.description || getDefaultDescription(product.id, interval),
      });
    }

    // Sort products: monthly first, then annual
    transformedProducts.sort((a, b) => {
      if (a.interval === 'month' && b.interval === 'year') return -1;
      if (a.interval === 'year' && b.interval === 'month') return 1;
      return 0;
    });

    return new Response(
      JSON.stringify({ products: transformedProducts }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching Stripe products:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch products',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function getProductFeatures(productId: string, interval?: string): string[] {
  // Define features based on product ID
  if (productId === 'prod_SijXdzmu0toRPV' || interval === 'year') {
    return [
      'Unlimited email processing',
      'Advanced AI categorization',
      'Google Drive integration',
      'Priority support',
      'Custom folder structures',
      'Advanced analytics',
      'Annual billing (save 27%)'
    ];
  } else if (productId === 'prod_SijYQtin4uF1B2' || interval === 'month') {
    return [
      'Unlimited email processing',
      'AI-powered categorization',
      'Google Drive integration',
      'Email support',
      'Basic analytics',
      'Monthly billing'
    ];
  }

  // Default features
  return [
    'Unlimited email processing',
    'AI-powered categorization',
    'Google Drive integration',
    'Email support'
  ];
}

function getDefaultDescription(productId: string, interval?: string): string {
  if (productId === 'prod_SijXdzmu0toRPV' || interval === 'year') {
    return 'Best value plan with all features and priority support';
  } else if (productId === 'prod_SijYQtin4uF1B2' || interval === 'month') {
    return 'Perfect for getting started with automated document organization';
  }
  
  return 'Automated document organization with AI-powered categorization';
}