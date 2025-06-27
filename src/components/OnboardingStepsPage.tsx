import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CreditCard, 
  Mail, 
  FolderOpen, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Shield,
  Zap,
  Crown,
  Settings,
  Lock,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react';
import { EmailSetupPage } from './EmailSetupPage';
import { FolderSetupPage } from './FolderSetupPage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  action: string;
}

interface OnboardingStepsData {
  payment_completed: boolean;
  email_connected: boolean;
  folder_selected: boolean;
  onboarding_completed: boolean;
}

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
}

interface OnboardingStepsPageProps {
  onComplete: () => void;
  onClose: () => void;
  isSubscribed: boolean;
  mode: 'setup' | 'manage';
}

export function OnboardingStepsPage({ onComplete, onClose, isSubscribed: propIsSubscribed, mode }: OnboardingStepsPageProps) {
  const [user, setUser] = useState<any>(null);
  const [stepsData, setStepsData] = useState<OnboardingStepsData>({
    payment_completed: false,
    email_connected: false,
    folder_selected: false,
    onboarding_completed: false
  });
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'email' | 'folder'>('overview');

  // Determine subscription status from database
  const isSubscribed = subscription?.subscription_status === 'active' || propIsSubscribed;

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await Promise.all([
          loadOnboardingSteps(session.user.id),
          loadSubscriptionData()
        ]);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        return;
      }

      if (data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadOnboardingSteps = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_onboarding_steps')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading onboarding steps:', error);
        return;
      }

      if (data) {
        setStepsData({
          payment_completed: data.payment_completed,
          email_connected: data.email_connected,
          folder_selected: data.folder_selected,
          onboarding_completed: data.onboarding_completed
        });
      } else {
        // Initialize steps if they don't exist
        await initializeOnboardingSteps(userId);
      }
    } catch (error) {
      console.error('Error loading onboarding steps:', error);
    }
  };

  const initializeOnboardingSteps = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('initialize_user_onboarding', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error initializing onboarding steps:', error);
      }
    } catch (error) {
      console.error('Error initializing onboarding steps:', error);
    }
  };

  const handleStepAction = async (stepId: string) => {
    switch (stepId) {
      case 'payment':
        if (!isSubscribed) {
          window.location.href = '/#pricing';
        } else {
          // Already completed, maybe show billing management
          alert('Payment completed! Manage your subscription in the billing section.');
        }
        break;
      case 'email':
        if (!isSubscribed) {
          window.location.href = '/#pricing';
        } else {
          setCurrentView('email');
        }
        break;
      case 'folder':
        if (!isSubscribed) {
          window.location.href = '/#pricing';
        } else {
          setCurrentView('folder');
        }
        break;
    }
  };

  const handleEmailSetupComplete = async () => {
    setCurrentView('overview');
    if (user) {
      await loadOnboardingSteps(user.id);
    }
  };

  const handleFolderSetupComplete = async () => {
    setCurrentView('overview');
    if (user) {
      await loadOnboardingSteps(user.id);
      // Check if all steps are completed
      const { data } = await supabase
        .from('user_onboarding_steps')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      if (data?.onboarding_completed) {
        onComplete();
      }
    }
  };

  const getStepStatus = (stepId: string): 'completed' | 'available' | 'locked' => {
    switch (stepId) {
      case 'payment':
        return stepsData.payment_completed || isSubscribed ? 'completed' : 'available';
      case 'email':
        if (stepsData.email_connected) return 'completed';
        return isSubscribed ? 'available' : 'locked';
      case 'folder':
        if (stepsData.folder_selected) return 'completed';
        return isSubscribed ? 'available' : 'locked';
      default:
        return 'locked';
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'payment',
      title: mode === 'manage' ? 'Subscription Management' : 'Choose Your Plan',
      description: mode === 'manage' 
        ? 'Manage your subscription and billing settings'
        : 'Select a subscription plan to get started',
      completed: stepsData.payment_completed || isSubscribed,
      icon: CreditCard,
      action: mode === 'manage' ? 'Manage Billing' : 'Choose Plan'
    },
    {
      id: 'email',
      title: mode === 'manage' ? 'Email Account Settings' : 'Connect Email Accounts',
      description: mode === 'manage'
        ? 'Manage connected email accounts and monitoring settings'
        : 'Add email accounts to monitor for attachments',
      completed: stepsData.email_connected,
      icon: Mail,
      action: mode === 'manage' ? 'Manage Emails' : 'Connect Email'
    },
    {
      id: 'folder',
      title: mode === 'manage' ? 'Folder Organization Settings' : 'Select Organization Folder',
      description: mode === 'manage'
        ? 'Update your Google Drive organization preferences'
        : 'Choose where to organize your documents in Google Drive',
      completed: stepsData.folder_selected,
      icon: FolderOpen,
      action: mode === 'manage' ? 'Manage Folders' : 'Select Folder'
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const allStepsCompleted = completedSteps === steps.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your setup progress...</p>
        </div>
      </div>
    );
  }

  // Render specific setup pages
  if (currentView === 'email') {
    return (
      <EmailSetupPage
        onComplete={handleEmailSetupComplete}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'folder') {
    return (
      <FolderSetupPage
        onComplete={handleFolderSetupComplete}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  // Main overview page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-white mr-3" />
              <span className="text-xl font-bold text-white">FilePilot</span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {mode === 'manage' ? 'Back to Dashboard' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            {mode === 'manage' ? (
              <Settings className="w-10 h-10 text-blue-600" />
            ) : allStepsCompleted ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <Play className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {mode === 'manage' 
              ? 'Account Settings' 
              : allStepsCompleted 
                ? 'Setup Complete! 🎉'
                : 'Complete Your Setup'
            }
          </h1>
          
          <p className="text-xl text-blue-100 mb-6">
            {mode === 'manage'
              ? 'Manage your FilePilot account settings and preferences'
              : allStepsCompleted
                ? 'Your FilePilot account is fully configured and ready to use'
                : `${completedSteps} of ${steps.length} steps completed`
            }
          </p>

          {!allStepsCompleted && mode !== 'manage' && (
            <div className="w-full max-w-md mx-auto bg-white/20 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-400 to-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / steps.length) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const status = getStepStatus(step.id);
            
            return (
              <div
                key={step.id}
                className={`bg-white rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 ${
                  status === 'completed' 
                    ? 'border-green-200 bg-green-50' 
                    : status === 'available'
                    ? 'border-blue-200 hover:border-blue-300 hover:shadow-2xl cursor-pointer'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
                onClick={() => status === 'available' && handleStepAction(step.id)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-100' : 
                    status === 'available' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : status === 'locked' ? (
                      <Lock className="w-8 h-8 text-gray-400" />
                    ) : (
                      <StepIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    Step {index + 1}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                
                {status === 'completed' ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {mode === 'manage' ? 'Configured' : 'Completed'}
                  </div>
                ) : status === 'available' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepAction(step.id);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    {step.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <div className="flex items-center text-gray-400 font-medium">
                    <Lock className="w-5 h-5 mr-2" />
                    {isSubscribed ? 'Complete previous steps' : 'Subscription required'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          {allStepsCompleted ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">
                    {mode === 'manage' ? 'Settings Updated' : 'Setup Complete!'}
                  </h3>
                </div>
                <p className="text-green-700">
                  {mode === 'manage' 
                    ? 'Your account settings have been updated successfully.'
                    : 'FilePilot is now monitoring your email and organizing attachments automatically.'
                  }
                </p>
              </div>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center mx-auto"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          ) : !isSubscribed ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-yellow-900">Subscription Required</h3>
              </div>
              <p className="text-yellow-700 mb-4">
                Complete your payment to unlock all FilePilot features and continue setup.
              </p>
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Choose Your Plan
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-blue-900">Continue Setup</h3>
              </div>
              <p className="text-blue-700">
                Complete the remaining steps to start organizing your email attachments.
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center text-white">
            <Shield className="w-5 h-5 mr-3 text-green-400" />
            <span className="text-sm">
              Your data is encrypted and secure. We never store your emails or documents permanently.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}