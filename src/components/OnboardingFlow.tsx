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
  Plus,
  Trash2,
  FileText,
  Shield,
  Zap,
  Crown,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { stripeProducts } from '../stripe-config';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo';
  connected: boolean;
  lastSync?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  children?: DriveFolder[];
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onClose: () => void;
}

export function OnboardingFlow({ onComplete, onClose }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Step 1 - Payment
  const [selectedPlan, setSelectedPlan] = useState<string>(stripeProducts[1].priceId); // Default to yearly
  
  // Step 2 - Email Accounts
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  
  // Step 3 - Drive Folder
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  useEffect(() => {
    checkUser();
    if (currentStep === 3) {
      loadDriveFolders();
    }
  }, [currentStep]);

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

    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: selectedPlan,
          success_url: `${window.location.origin}/onboarding?step=2`,
          cancel_url: `${window.location.origin}/onboarding?step=1`,
          mode: 'subscription'
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectEmailAccount = async (provider: 'gmail' | 'outlook' | 'yahoo') => {
    setIsConnectingEmail(true);
    
    try {
      // Simulate email connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newAccount: EmailAccount = {
        id: Math.random().toString(36).substr(2, 9),
        email: `user@${provider}.com`,
        provider,
        connected: true,
        lastSync: new Date().toISOString()
      };
      
      setEmailAccounts(prev => [...prev, newAccount]);
    } catch (error) {
      console.error('Error connecting email:', error);
    } finally {
      setIsConnectingEmail(false);
    }
  };

  const removeEmailAccount = (accountId: string) => {
    setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const loadDriveFolders = async () => {
    setIsLoadingFolders(true);
    
    try {
      // Simulate loading Google Drive folders
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockFolders: DriveFolder[] = [
        {
          id: 'root',
          name: 'My Drive',
          path: '/',
          children: [
            {
              id: 'documents',
              name: 'Documents',
              path: '/Documents',
              parentId: 'root',
              children: [
                { id: 'finance', name: 'Finance', path: '/Documents/Finance', parentId: 'documents' },
                { id: 'legal', name: 'Legal', path: '/Documents/Legal', parentId: 'documents' },
                { id: 'projects', name: 'Projects', path: '/Documents/Projects', parentId: 'documents' }
              ]
            },
            {
              id: 'work',
              name: 'Work',
              path: '/Work',
              parentId: 'root',
              children: [
                { id: 'contracts', name: 'Contracts', path: '/Work/Contracts', parentId: 'work' },
                { id: 'reports', name: 'Reports', path: '/Work/Reports', parentId: 'work' }
              ]
            },
            { id: 'personal', name: 'Personal', path: '/Personal', parentId: 'root' }
          ]
        }
      ];
      
      setDriveFolders(mockFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderTree = (folders: DriveFolder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedFolder === folder.id 
              ? 'bg-blue-100 border-2 border-blue-300' 
              : 'hover:bg-gray-50 border-2 border-transparent'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          {folder.children && folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          <FolderOpen className="w-5 h-5 text-blue-500 mr-3" />
          
          <div className="flex-1">
            <div className="font-medium text-gray-900">{folder.name}</div>
            <div className="text-xs text-gray-500">{folder.path}</div>
          </div>
          
          {selectedFolder === folder.id && (
            <Check className="w-5 h-5 text-blue-600" />
          )}
        </div>
        
        {folder.children && expandedFolders.has(folder.id) && (
          <div className="ml-4">
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedPlan !== '';
      case 2:
        return emailAccounts.length > 0;
      case 3:
        return selectedFolder !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handlePayment();
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome to FilePilot</h1>
              <p className="text-blue-100 mt-1">Let's get your account set up in 3 simple steps</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-8 space-x-8">
            {[
              { number: 1, title: 'Choose Plan', icon: CreditCard },
              { number: 2, title: 'Connect Email', icon: Mail },
              { number: 3, title: 'Select Folder', icon: FolderOpen }
            ].map((step, index) => {
              const status = getStepStatus(step.number);
              const StepIcon = step.icon;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    status === 'completed' 
                      ? 'bg-green-500 border-green-500' 
                      : status === 'current'
                      ? 'bg-white border-white text-blue-600'
                      : 'border-white/50 text-white/50'
                  }`}>
                    {status === 'completed' ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <div className={`font-semibold ${
                      status === 'current' ? 'text-white' : 'text-white/70'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-white/60">Step {step.number}</div>
                  </div>
                  
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-6 ${
                      getStepStatus(step.number + 1) !== 'upcoming' ? 'bg-white' : 'bg-white/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Payment */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                <p className="text-gray-600">Select the plan that best fits your needs</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {stripeProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan === product.priceId
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPlan(product.priceId)}
                  >
                    {product.name === 'Yearly Plan' && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block">
                        <Crown className="w-3 h-3 inline mr-1" />
                        Most Popular
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{product.price}</div>
                      <div className="text-gray-500 mb-4">per {product.interval}</div>
                      
                      {product.name === 'Yearly Plan' && (
                        <div className="text-sm text-green-600 font-medium mb-4">Save 2 months!</div>
                      )}
                    </div>
                    
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Email Accounts */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Email Accounts</h2>
                <p className="text-gray-600">Choose which email accounts you want FilePilot to monitor for attachments</p>
              </div>
              
              {/* Connected Accounts */}
              {emailAccounts.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                    <Check className="w-5 h-5 mr-2" />
                    Connected Accounts ({emailAccounts.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {emailAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <Mail className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{account.email}</div>
                            <div className="text-sm text-gray-500 capitalize">{account.provider}</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeEmailAccount(account.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add New Account */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Email Account
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { provider: 'gmail' as const, name: 'Gmail', color: 'red' },
                    { provider: 'outlook' as const, name: 'Outlook', color: 'blue' },
                    { provider: 'yahoo' as const, name: 'Yahoo', color: 'purple' }
                  ].map((email) => (
                    <button
                      key={email.provider}
                      onClick={() => connectEmailAccount(email.provider)}
                      disabled={isConnectingEmail}
                      className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${email.color}-300 hover:bg-${email.color}-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 bg-${email.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <Mail className={`w-6 h-6 text-${email.color}-600`} />
                        </div>
                        <div className="font-medium text-gray-900">{email.name}</div>
                        <div className="text-sm text-gray-500">Connect account</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {isConnectingEmail && (
                  <div className="flex items-center justify-center mt-4 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Connecting to email account...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Drive Folder */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Organization Folder</h2>
                <p className="text-gray-600">Choose where FilePilot should organize your email attachments in Google Drive</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Google Drive Folders</h3>
                  <button
                    onClick={loadDriveFolders}
                    disabled={isLoadingFolders}
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                
                {isLoadingFolders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Loading your Google Drive folders...</span>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {driveFolders.length > 0 ? (
                      <div className="p-4">
                        {renderFolderTree(driveFolders)}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No folders found. Please make sure you have access to Google Drive.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedFolder && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-blue-800">
                      <Check className="w-5 h-5 mr-2" />
                      <span className="font-medium">Selected folder: </span>
                      <span className="ml-1">
                        {driveFolders.find(f => f.id === selectedFolder)?.path || 'Unknown folder'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>Your data is encrypted and secure</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!canProceedToNextStep() || isLoading}
                className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {currentStep === 1 ? 'Continue to Payment' : currentStep === 2 ? 'Continue' : 'Complete Setup'}
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