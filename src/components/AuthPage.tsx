import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AuthForm } from './AuthForm';
import { OnboardingFlow } from './OnboardingFlow';
import { FileText, ArrowLeft } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthPageProps {
  mode: 'login' | 'signup';
  onAuthSuccess: () => void;
}

export function AuthPage({ mode, onAuthSuccess }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(mode);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  useEffect(() => {
    // Check if user is already authenticated and redirect appropriately
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already authenticated, redirect to home
        window.location.href = '/';
      }
    };
    
    checkAuth();
  }, []);

  const goHome = () => {
    window.location.href = '/';
  };

  const handleAuthSuccess = () => {
    // Show onboarding modal immediately after successful auth
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // After payment completion, redirect to success page
    window.location.href = "/success";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Onboarding Flow Modal */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-white mr-3" />
              <span className="text-xl font-bold text-white">FilePilot</span>
            </div>
            <button
              onClick={goHome}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to home
            </button>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex items-center justify-center min-h-[calc(100vh-88px)] px-4 sm:px-6 lg:px-8 py-12">
        <AuthForm
          mode={authMode}
          onSuccess={handleAuthSuccess}
          onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
    </div>
  );
}