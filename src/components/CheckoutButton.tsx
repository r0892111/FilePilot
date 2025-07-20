import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CreditCard } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CheckoutButtonProps {
  priceId: string;
  mode: 'payment' | 'subscription';
  planName: string;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({ 
  priceId, 
  mode, 
  planName, 
  className = '',
  children 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Redirect to signup if not authenticated
        window.location.href = '/signup';
        return;
      }

      // Get the current origin for redirect URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/success`;
      const cancelUrl = `${baseUrl}/#pricing`;

      // Call the checkout edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`relative flex items-center justify-center transition-all duration-200 ${className} ${
          isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {children || (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Get {planName}
              </>
            )}
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}