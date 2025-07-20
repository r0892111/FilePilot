import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Crown, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { planConfigs } from '../stripe-config';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

interface SubscriptionStatusProps {
  className?: string;
}

export function SubscriptionStatus({ className = '' }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setError('Failed to load subscription status');
      } else {
        setSubscription(data);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanName = (priceId: string | null) => {
    if (!priceId) return 'Free Plan';
    
    const plan = planConfigs.find(p => p.priceId === priceId);
    return plan?.name || 'Unknown Plan';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'trialing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'canceled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Crown className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'trialing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'past_due':
      case 'unpaid':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'canceled':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-600">Loading subscription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor('not_started')} ${className}`}>
        <Crown className="w-4 h-4 mr-2" />
        Free Plan
      </div>
    );
  }

  const planName = getPlanName(subscription.price_id);
  const statusIcon = getStatusIcon(subscription.subscription_status);
  const statusColor = getStatusColor(subscription.subscription_status);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
        {statusIcon}
        <span className="ml-2">{planName}</span>
      </div>
      
      {subscription.current_period_end && (
        <div className="text-xs text-gray-600">
          {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
          {formatDate(subscription.current_period_end)}
        </div>
      )}
    </div>
  );
}