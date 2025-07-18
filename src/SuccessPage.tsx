import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Check,
  FileText,
  Mail,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home,
  CheckCircle,
} from "lucide-react";
import { SubscriptionStatus } from "./components/SubscriptionStatus";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    checkUserAndUpdatePayment();
  }, []);

  useEffect(() => {
    // Check if user is authenticated, redirect to login if not
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = '/login';
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (user) {
      window.location.href = "/steps";
    }
  }, [countdown, user]);

  const checkUserAndUpdatePayment = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Mark payment as completed in onboarding steps
        await updatePaymentStep(session.user.id);
      } else {
        // Redirect to login if not authenticated
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error checking user:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStep = async (userId: string) => {
    try {
      // Update payment step as completed
      const { error } = await supabase.rpc('update_onboarding_step', {
        user_uuid: userId,
        step_name: 'payment',
        completed: true
      });

      if (error) {
        console.error("Error updating payment step:", error);
      }
    } catch (error) {
      console.error("Error updating payment step:", error);
    }
  };

  const goHome = () => {
    window.location.href = "/";
  };

  const goToSteps = () => {
    window.location.href = "/steps";
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">FilePilot</span>
            </div>
            <div className="flex items-center space-x-4">
              <SubscriptionStatus />
              <button
                onClick={goHome}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>

          <p className="text-xl text-gray-600 mb-2">Welcome to FilePilot</p>

          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium">
            <Check className="w-4 h-4 mr-2" />
            Your subscription is now active
          </div>
        </div>

        {/* Redirect Message */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
            <div className="text-2xl font-bold text-blue-600">{countdown}</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Setting up your account...
          </h2>

          <p className="text-gray-600 mb-6">
            Thank you for your payment! Your FilePilot subscription is now active. 
            We're preparing your account and you'll be redirected to complete the setup process in {countdown} seconds.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>Connect your email accounts for monitoring</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span>Select your Google Drive organization folder</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2" />
                <span>Start automatic document organization</span>
              </div>
            </div>
          </div>

          {/* Show selected plan info */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <div className="flex items-center mb-2">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">Subscription Active</span>
            </div>
            <p className="text-sm text-green-700">
              Your FilePilot subscription is now active and ready to organize your documents.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={goToSteps}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              Continue Setup Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-500 mt-6">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;