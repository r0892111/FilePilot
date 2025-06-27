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
} from "lucide-react";
import { SubscriptionStatus } from "./components/SubscriptionStatus";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndUpdatePayment();
  }, []);

  const checkUserAndUpdatePayment = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Mark payment as completed in onboarding steps
        await updatePaymentStep(session.user.id);

        // Redirect to steps page after a short delay
        setTimeout(() => {
          window.location.href = "/steps";
        }, 3000);
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
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Setting up your account...
          </h2>

          <p className="text-gray-600 mb-6">
            We're preparing your FilePilot experience. You'll be redirected to
            complete the setup process in just a moment.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong>
              <br />
              Connect your email accounts and select your Google Drive
              organization folder to start using FilePilot.
            </p>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;