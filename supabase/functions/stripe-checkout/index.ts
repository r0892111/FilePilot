import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Log environment variables for debugging (remove in production)
console.log('Environment check:', {
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  hasStripeKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
  supabaseUrl: Deno.env.get('SUPABASE_URL')?.substring(0, 20) + '...',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
  console.error('Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    stripeSecret: !!stripeSecret,
  });
}

const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');
const stripe = new Stripe(stripeSecret ?? '', {
  appInfo: {
    name: 'FilePilot Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    console.log('Stripe checkout request received:', req.method);

    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);

    const { price_id, success_url, cancel_url, mode } = requestBody;

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      console.error('Parameter validation error:', error);
      return corsResponse({ error }, 400);
    }

    console.log('Validating price ID with Stripe:', price_id);

    // Validate price exists in Stripe before proceeding
    try {
      const price = await stripe.prices.retrieve(price_id);
      console.log('Price validation successful:', { id: price.id, active: price.active });
      
      if (!price.active) {
        console.error('Price is not active:', price_id);
        return corsResponse({ error: 'Selected price is not available' }, 400);
      }
    } catch (stripeError: any) {
      console.error('Stripe price validation error:', stripeError.message);
      return corsResponse({ 
        error: `Invalid price ID: ${stripeError.message}`,
        price_id: price_id 
      }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return corsResponse({ error: 'Authorization header required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Authenticating user with token length:', token.length);

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      console.error('User authentication error:', getUserError);
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      console.error('No user found');
      return corsResponse({ error: 'User not found' }, 404);
    }

    console.log('User authenticated:', user.id);

    // Check for existing customer
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Database error fetching customer:', getCustomerError);
      return corsResponse({ error: 'Failed to fetch customer information' }, 500);
    }

    let customerId;

    if (!customer || !customer.customer_id) {
      console.log('Creating new Stripe customer for user:', user.id);
      
      try {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });

        console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

        const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

        if (createCustomerError) {
          console.error('Failed to save customer information in the database', createCustomerError);

          // Try to clean up the Stripe customer
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to clean up Stripe customer:', deleteError);
          }

          return corsResponse({ error: 'Failed to create customer mapping' }, 500);
        }

        if (mode === 'subscription') {
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: newCustomer.id,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to save subscription in the database', createSubscriptionError);

            // Try to clean up
            try {
              await stripe.customers.del(newCustomer.id);
              await supabase.from('stripe_customers').delete().eq('customer_id', newCustomer.id);
            } catch (deleteError) {
              console.error('Failed to clean up after subscription creation error:', deleteError);
            }

            return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
          }
        }

        customerId = newCustomer.id;
      } catch (stripeCustomerError: any) {
        console.error('Failed to create Stripe customer:', stripeCustomerError);
        return corsResponse({ error: 'Failed to create customer account' }, 500);
      }
    } else {
      customerId = customer.customer_id;
      console.log('Using existing customer:', customerId);

      if (mode === 'subscription') {
        // Verify subscription exists for existing customer
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);
          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);
            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
          }
        }
      }
    }

    console.log('Creating Stripe checkout session for customer:', customerId);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url,
      customer_id: customerId 
    });

  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`, error);
    return corsResponse({ 
      error: error.message,
      stack: error.stack 
    }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}