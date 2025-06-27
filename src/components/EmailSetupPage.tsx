import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Mail, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Shield,
  Zap,
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook';
  connected: boolean;
  lastSync?: string;
  status: 'active' | 'error' | 'syncing';
}

interface EmailSetupPageProps {
  onComplete: () => void;
  onBack: () => void;
}

export function EmailSetupPage({ onComplete, onBack }: EmailSetupPageProps) {
  const [user, setUser] = useState<any>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook'>('gmail');
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadEmailAccounts();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading email accounts:', error);
        return;
      }

      const accounts: EmailAccount[] = (data || []).map(account => ({
        id: account.id.toString(),
        email: account.email,
        provider: account.provider as 'gmail' | 'outlook',
        connected: true,
        lastSync: account.last_sync,
        status: account.status as 'active' | 'error' | 'syncing'
      }));

      setEmailAccounts(accounts);
    } catch (error) {
      console.error('Error loading email accounts:', error);
    }
  };

  const handleAddEmailClick = (provider: 'gmail' | 'outlook') => {
    setSelectedProvider(provider);
    setEmailInput('');
    setShowAddEmailModal(true);
  };

  const handleAddEmail = async () => {
    if (!emailInput.trim() || !user) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      alert('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    if (emailAccounts.some(account => account.email === emailInput)) {
      alert('This email account is already connected');
      return;
    }

    setIsConnecting(true);
    setConnectingProvider(selectedProvider);

    try {
      // Call Supabase function to add email account
      const { data, error } = await supabase.rpc('add_user_email_account', {
        user_uuid: user.id,
        email_address: emailInput.trim(),
        email_provider: selectedProvider
      });

      if (error) {
        console.error('Error adding email account:', error);
        if (error.message.includes('already exists')) {
          alert('This email account is already connected to your account');
        } else {
          alert('Failed to add email account. Please try again.');
        }
        return;
      }

      // Add to local state
      const newAccount: EmailAccount = {
        id: data.id.toString(),
        email: data.email,
        provider: data.provider as 'gmail' | 'outlook',
        connected: true,
        lastSync: data.connected_at,
        status: 'active'
      };

      setEmailAccounts(prev => [newAccount, ...prev]);
      setShowAddEmailModal(false);
      setEmailInput('');

    } catch (error) {
      console.error('Error adding email account:', error);
      alert('An error occurred while adding the email account. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingProvider('');
    }
  };

  const removeEmailAccount = async (accountId: string, email: string) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to remove ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('remove_user_email_account', {
        user_uuid: user.id,
        email_address: email
      });

      if (error) {
        console.error('Error removing email account:', error);
        alert('Failed to remove email account. Please try again.');
        return;
      }

      setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error removing email account:', error);
      alert('An error occurred while removing the email account. Please try again.');
    }
  };

  const testConnection = async (accountId: string, email: string) => {
    if (!user) return;

    setEmailAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, status: 'syncing' }
        : acc
    ));

    try {
      // Update status to syncing in database
      await supabase.rpc('update_email_account_status', {
        user_uuid: user.id,
        email_address: email,
        new_status: 'syncing'
      });

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update to active status
      const { error } = await supabase.rpc('update_email_account_status', {
        user_uuid: user.id,
        email_address: email,
        new_status: 'active'
      });

      if (error) {
        console.error('Error updating email status:', error);
      }

      setEmailAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, status: 'active', lastSync: new Date().toISOString() }
          : acc
      ));
    } catch (error) {
      console.error('Error testing connection:', error);
      setEmailAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, status: 'error' }
          : acc
      ));
    }
  };

  const handleComplete = async () => {
    if (emailAccounts.length === 0) {
      alert('Please connect at least one email account to continue.');
      return;
    }

    if (!user) return;

    try {
      // Update the email step as completed
      const { error } = await supabase.rpc('update_onboarding_step', {
        user_uuid: user.id,
        step_name: 'email',
        completed: true
      });

      if (error) {
        console.error('Error updating email step:', error);
        return;
      }

      onComplete();
    } catch (error) {
      console.error('Error completing email setup:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-red-600" />
          </div>
        );
      case 'outlook':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Add Email Modal */}
      {showAddEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Email Account</h3>
              <button
                onClick={() => setShowAddEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedProvider('gmail')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedProvider === 'gmail'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {getProviderIcon('gmail')}
                      <span className="ml-2 font-medium">Gmail</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedProvider('outlook')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedProvider === 'outlook'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {getProviderIcon('outlook')}
                      <span className="ml-2 font-medium">Outlook</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={`Enter your ${selectedProvider} email address`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddEmailModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmail}
                disabled={!emailInput.trim() || isConnecting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Adding...
                  </>
                ) : (
                  'Add Email'
                )}
              </button>
            </div>
          </div>
        </div>
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
              onClick={onBack}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Steps
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Connect Your Email Accounts
          </h1>
          
          <p className="text-xl text-blue-100 mb-6">
            Add the email accounts you want FilePilot to monitor for attachments
          </p>

          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 text-blue-200 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            We only read attachment metadata - never email content
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Setup Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Connected Accounts */}
            {emailAccounts.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Connected Accounts ({emailAccounts.length})
                  </h2>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm"
                  >
                    {showAdvanced ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </button>
                </div>
                
                <div className="space-y-4">
                  {emailAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                      <div className="flex items-center">
                        {getProviderIcon(account.provider)}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{account.email}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            {getStatusIcon(account.status)}
                            <span className="ml-2 capitalize">{account.status}</span>
                            {account.lastSync && account.status === 'active' && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Last sync: {new Date(account.lastSync).toLocaleTimeString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {showAdvanced && (
                          <>
                            <button
                              onClick={() => testConnection(account.id, account.email)}
                              disabled={account.status === 'syncing'}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${account.status === 'syncing' ? 'animate-spin' : ''}`} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeEmailAccount(account.id, account.email)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Account */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <Plus className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Add Email Account</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { provider: 'gmail' as const, name: 'Gmail', color: 'red', description: 'Google Workspace & Gmail' },
                  { provider: 'outlook' as const, name: 'Outlook', color: 'blue', description: 'Microsoft 365 & Outlook.com' }
                ].map((email) => (
                  <button
                    key={email.provider}
                    onClick={() => handleAddEmailClick(email.provider)}
                    disabled={isConnecting}
                    className={`p-6 rounded-xl border-2 border-gray-200 hover:border-${email.color}-300 hover:bg-${email.color}-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left`}
                  >
                    <div className="flex items-center mb-3">
                      {getProviderIcon(email.provider)}
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900">{email.name}</div>
                        <div className="text-sm text-gray-500">{email.description}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Click to add account
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Aligned with main content */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">What We Monitor</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Email attachments (PDF, Word, Excel, etc.)
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Attachment metadata and file types
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Sender information for categorization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Subject lines for context
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Read-only access to attachments
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  No email content is stored
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  End-to-end encryption
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Revoke access anytime
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={onBack}
            className="flex items-center px-6 py-3 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Steps
          </button>
          
          <button
            onClick={handleComplete}
            disabled={emailAccounts.length === 0}
            className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            Continue to Folder Setup
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}