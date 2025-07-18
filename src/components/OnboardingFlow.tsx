import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CreditCard, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  FileText,
  Shield,
  Crown,
  X
} from 'lucide-react';
import { stripeProducts } from '../stripe-config';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface OnboardingFlowProps {
  onComplete: () => void;
  onClose: () => void;
}

export function OnboardingFlow({ onComplete, onClose }: OnboardingFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(
    stripeProducts.find(p => p.name === 'FilePilot Annual')?.priceId || stripeProducts[0].priceId
  ); // Default to annual plan

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handlePayment = async () => {
    if (!user) return;

    console.log('Starting payment process with plan:', selectedPlan);
    console.log('User:', user.id);

    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        alert('Please sign in again to continue');
        return;
      }

      console.log('Session found, creating checkout...');

      const requestBody = {
        price_id: selectedPlan,
        success_url: `${import.meta.env.VITE_SITE_URL || window.location.origin}/success`,
        cancel_url: `${import.meta.env.VITE_SITE_URL || window.location.origin}/`,
        mode: 'subscription'
      };

      console.log('Request body:', requestBody);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data);
        alert(`Failed to create checkout session: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4 sm:my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Choose Your Plan</h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Start your FilePilot journey today</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 sm:p-2 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Select Your Subscription</h2>
            <p className="text-gray-600 text-sm sm:text-base">Choose the plan that best fits your needs</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mb-6 sm:mb-8">
            {stripeProducts.map((product) => (
              <div
                key={product.id}
                className={`rounded-2xl p-4 sm:p-6 border-2 cursor-pointer transition-all duration-300 ${
                  selectedPlan === product.priceId
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(product.priceId)}
              >
                {product.name === 'FilePilot Annual' && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block">
                    <Crown className="w-3 h-3 inline mr-1 flex-shrink-0" />
                    Recommended
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{product.price}</div>
                  <div className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
                    {product.interval ? `per ${product.interval}` : 'one-time'}
                  </div>
                  
                  {product.name === 'FilePilot Annual' && (
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-3 sm:mb-4">Complete solution!</div>
                  )}
                </div>
                      
                <ul className="space-y-2 sm:space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-xs sm:text-sm">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-gray-600 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>Secure payment with Stripe</span>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 order-1 sm:order-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex items-center px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handlePayment}
                disabled={!selectedPlan || isLoading}
                className="flex items-center px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">Processing</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Continue to Payment</span>
                    <span className="sm:hidden">Continue</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}