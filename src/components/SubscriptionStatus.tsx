import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Crown, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { stripeProducts } from "../stripe-config";

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

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("stripe_user_subscriptions")
        .select(
          "subscription_status, price_id, current_period_end, cancel_at_period_end"
        )
        .maybeSingle();
      console.log("Fetched subscription data:", data);

      if (error) {
        console.error("Error fetching subscription:", error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductName = (priceId: string | null) => {
    if (!priceId) return "Unknown Plan";
    
    // Map price IDs to product names
    const priceToNameMap: { [key: string]: string } = {
      'price_1RnzlbLPohnizGblMopmOjP0': 'testsubscription',
      'price_1RnI4jLPohnizGblTUXhsAK3': 'Filepilot Year'
    };
    
    return priceToNameMap[priceId] || "Filepilot Plan";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse flex items-center">
          <div className="w-5 h-5 bg-gray-300 rounded mr-3"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === "not_started") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              No active subscription
            </p>
            <p className="text-xs text-yellow-600">
              Choose a plan to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = subscription.subscription_status === "active";
  const isPastDue = subscription.subscription_status === "past_due";
  const isCanceled = subscription.subscription_status === "canceled";

  const periodEndDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null;

  const getStatusIcon = () => {
    if (isActive) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isPastDue) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (isCanceled) return <Clock className="w-5 h-5 text-gray-600" />;
    return <Crown className="w-5 h-5 text-blue-600" />;
  };

  const getStatusColor = () => {
    if (isActive) return "bg-green-50 border-green-200";
    if (isPastDue) return "bg-red-50 border-red-200";
    if (isCanceled) return "bg-gray-50 border-gray-200";
    return "bg-blue-50 border-blue-200";
  };

  const getStatusText = () => {
    if (isActive && subscription.cancel_at_period_end) {
      return "Active (Canceling)";
    }
    if (subscription.subscription_status) {
      return (
        subscription.subscription_status.charAt(0).toUpperCase() +
        subscription.subscription_status.slice(1).replace("_", " ")
      );
    }
    return "Unknown";
  };

  return (
    <div className={`rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {getProductName(subscription.price_id)}
            </p>
            <p className="text-xs text-gray-600">Status: {getStatusText()}</p>
          </div>
        </div>

        {periodEndDate && (
          <div className="text-right">
            <p className="text-xs text-gray-600">
              {subscription.cancel_at_period_end ? "Ends" : "Renews"}:{" "}
              {periodEndDate}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}