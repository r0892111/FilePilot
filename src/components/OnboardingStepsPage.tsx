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
  Play,
  Edit3,
  Save,
  X,
  ExternalLink,
  Trash2,
  Plus
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
  manageAction?: string;
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
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

interface OnboardingStepsPageProps {
  onComplete: () => void;
  onClose: () => void;
  isSubscribed: boolean;
  mode: 'setup' | 'manage';
}

interface EditableSettings {
  selectedFolder: string;
  duplicateHandling: 'skip' | 'rename' | 'replace';
  connectedEmails: string[];
  subscriptionCanceled: boolean;
}

interface ConnectedEmail {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook';
  status: 'active' | 'error';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsJustSaved, setSettingsJustSaved] = useState(false);
  const [settings, setSettings] = useState<EditableSettings>({
    selectedFolder: '/FilePilot/Documents',
    duplicateHandling: 'rename',
    connectedEmails: ['user@gmail.com', 'work@outlook.com'],
    subscriptionCanceled: false
  });
  const [originalSettings, setOriginalSettings] = useState<EditableSettings>(settings);

  // Determine subscription status from database
  const isSubscribed = subscription?.subscription_status === 'active' || propIsSubscribed;

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  // Clear the "settings just saved" message after 5 seconds
  useEffect(() => {
    if (settingsJustSaved) {
      const timer = setTimeout(() => {
        setSettingsJustSaved(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [settingsJustSaved]);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await Promise.all([
          loadOnboardingSteps(session.user.id),
          loadSubscriptionData(),
          loadUserSettings(session.user.id)
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
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
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

  const loadUserSettings = async (userId: string) => {
    // In a real app, this would load from a user_settings table
    // For now, we'll use mock data
    try {
      // Simulate loading user preferences
      const mockSettings: EditableSettings = {
        selectedFolder: '/FilePilot/Documents',
        duplicateHandling: 'rename',
        connectedEmails: ['user@gmail.com', 'work@outlook.com'],
        subscriptionCanceled: subscription?.cancel_at_period_end || false
      };
      setSettings(mockSettings);
      setOriginalSettings(mockSettings);
    } catch (error) {
      console.error('Error loading user settings:', error);
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
    if (mode === 'manage' && isEditMode) {
      // In edit mode, don't navigate to step pages
      return;
    }

    switch (stepId) {
      case 'payment':
        if (!isSubscribed) {
          window.location.href = '/#pricing';
        } else if (mode === 'manage') {
          // Open billing portal or subscription management
          alert('Billing management would open here. This would typically redirect to Stripe Customer Portal.');
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

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - restore original settings
      setSettings(originalSettings);
      setIsEditMode(false);
    } else {
      // Enter edit mode
      setOriginalSettings(settings);
      setIsEditMode(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // In a real app, this would save to a user_settings table
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update original settings to current settings
      setOriginalSettings(settings);
      setIsEditMode(false);
      
      // Show success message
      setSettingsJustSaved(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setSettings({
      ...settings,
      connectedEmails: settings.connectedEmails.filter(email => email !== emailToRemove)
    });
  };

  const handleAddEmail = () => {
    // In a real app, this would open an email connection flow
    const newEmail = prompt('Enter email address to connect:');
    if (newEmail && !settings.connectedEmails.includes(newEmail)) {
      setSettings({
        ...settings,
        connectedEmails: [...settings.connectedEmails, newEmail]
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      setSettings({
        ...settings,
        subscriptionCanceled: true
      });
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
      action: mode === 'manage' ? 'Manage Billing' : 'Choose Plan',
      manageAction: 'Open Billing Portal'
    },
    {
      id: 'email',
      title: mode === 'manage' ? 'Email Account Settings' : 'Connect Email Accounts',
      description: mode === 'manage'
        ? 'Manage connected email accounts and monitoring settings'
        : 'Add email accounts to monitor for attachments',
      completed: stepsData.email_connected,
      icon: Mail,
      action: mode === 'manage' ? 'Manage Emails' : 'Connect Email',
      manageAction: 'Configure Email Settings'
    },
    {
      id: 'folder',
      title: mode === 'manage' ? 'Folder Organization Settings' : 'Select Organization Folder',
      description: mode === 'manage'
        ? 'Update your Google Drive organization preferences'
        : 'Choose where to organize your documents in Google Drive',
      completed: stepsData.folder_selected,
      icon: FolderOpen,
      action: mode === 'manage' ? 'Manage Folders' : 'Select Folder',
      manageAction: 'Update Folder Settings'
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
            <div className="flex items-center space-x-4">
              {mode === 'manage' && (
                <div className="flex items-center space-x-2">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Settings
                    </button>
                  )}
                </div>
              )}
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
              ? isEditMode 
                ? 'Edit your FilePilot preferences and save changes'
                : 'Manage your FilePilot account settings and preferences'
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

        {/* Settings Panel (only in manage mode) */}
        {mode === 'manage' && isEditMode && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Settings</h2>
            
            <div className="space-y-8">
              {/* Selected Folder */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization Folder</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{settings.selectedFolder}</p>
                      <p className="text-sm text-gray-600">Current organization folder</p>
                    </div>
                    <button
                      onClick={() => setCurrentView('folder')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Change Folder
                    </button>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Duplicate Handling</h3>
                <select
                  value={settings.duplicateHandling}
                  onChange={(e) => setSettings({...settings, duplicateHandling: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="skip">Skip duplicates</option>
                  <option value="rename">Rename duplicates</option>
                  <option value="replace">Replace existing</option>
                </select>
                <p className="text-sm text-gray-600 mt-2">How to handle duplicate files when organizing</p>
              </div>

              {/* Connected Emails */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Connected Email Accounts</h3>
                  <button
                    onClick={handleAddEmail}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Email
                  </button>
                </div>
                <div className="space-y-3">
                  {settings.connectedEmails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {settings.connectedEmails.length === 0 && (
                    <p className="text-gray-500 text-sm">No email accounts connected</p>
                  )}
                </div>
              </div>

              {/* Subscription Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {subscription?.cancel_at_period_end ? 'Subscription Canceling' : 'Active Subscription'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {subscription?.cancel_at_period_end 
                          ? 'Your subscription will end at the current billing period'
                          : 'Manage your billing and subscription settings'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStepAction('payment')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Manage Billing
                      </button>
                      {!subscription?.cancel_at_period_end && (
                        <button
                          onClick={handleCancelSubscription}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const status = getStepStatus(step.id);
            
            return (
              <div
                key={step.id}
                className={`bg-white rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 flex flex-col h-full ${
                  status === 'completed' 
                    ? 'border-green-200 bg-green-50' 
                    : status === 'available'
                    ? 'border-blue-200 hover:border-blue-300 hover:shadow-2xl cursor-pointer'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                } ${isEditMode && mode === 'manage' ? 'pointer-events-none opacity-75' : ''}`}
                onClick={() => !isEditMode && status === 'available' && handleStepAction(step.id)}
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
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1">{step.description}</p>
                  
                  {/* Action button aligned at bottom */}
                  <div className="mt-auto">
                    {status === 'completed' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-green-600 font-medium">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {mode === 'manage' ? 'Configured' : 'Completed'}
                        </div>
                        {mode === 'manage' && step.id === 'payment' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepAction(step.id);
                            }}
                            className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Manage
                          </button>
                        )}
                      </div>
                    ) : status === 'available' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepAction(step.id);
                        }}
                        disabled={isEditMode && mode === 'manage'}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center disabled:cursor-not-allowed"
                      >
                        {mode === 'manage' && step.manageAction ? step.manageAction : step.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <div className="flex items-center text-gray-400 font-medium">
                        <Lock className="w-5 h-5 mr-2" />
                        {isSubscribed ? 'Complete previous steps' : 'Subscription required'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          {settingsJustSaved ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Settings Updated!</h3>
                </div>
                <p className="text-green-700">
                  Your account settings have been saved successfully.
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
          ) : allStepsCompleted && mode !== 'manage' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Setup Complete!</h3>
                </div>
                <p className="text-green-700">
                  FilePilot is now monitoring your email and organizing attachments automatically.
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
          ) : mode !== 'manage' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-blue-900">Continue Setup</h3>
              </div>
              <p className="text-blue-700">
                Complete the remaining steps to start organizing your email attachments.
              </p>
            </div>
          ) : null}
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