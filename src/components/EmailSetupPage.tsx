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
  Globe,
  Zap,
  CheckCircle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'other';
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

  useEffect(() => {
    checkUser();
    loadExistingAccounts();
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

  const loadExistingAccounts = () => {
    // Simulate loading existing connected accounts
    // In a real app, this would fetch from your database
    const mockAccounts: EmailAccount[] = [
      {
        id: '1',
        email: 'user@gmail.com',
        provider: 'gmail',
        connected: true,
        lastSync: new Date().toISOString(),
        status: 'active'
      }
    ];
    setEmailAccounts(mockAccounts);
  };

  const connectEmailAccount = async (provider: 'gmail' | 'outlook' | 'yahoo' | 'other') => {
    setIsConnecting(true);
    setConnectingProvider(provider);
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newAccount: EmailAccount = {
        id: Math.random().toString(36).substr(2, 9),
        email: `user@${provider === 'other' ? 'example' : provider}.com`,
        provider,
        connected: true,
        lastSync: new Date().toISOString(),
        status: 'active'
      };
      
      setEmailAccounts(prev => [...prev, newAccount]);
    } catch (error) {
      console.error('Error connecting email:', error);
    } finally {
      setIsConnecting(false);
      setConnectingProvider('');
    }
  };

  const removeEmailAccount = async (accountId: string) => {
    setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const testConnection = async (accountId: string) => {
    setEmailAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, status: 'syncing' }
        : acc
    ));

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    setEmailAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, status: 'active', lastSync: new Date().toISOString() }
        : acc
    ));
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
      case 'yahoo':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-purple-600" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                              onClick={() => testConnection(account.id)}
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
                          onClick={() => removeEmailAccount(account.id)}
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
                  { provider: 'outlook' as const, name: 'Outlook', color: 'blue', description: 'Microsoft 365 & Outlook.com' },
                  { provider: 'yahoo' as const, name: 'Yahoo Mail', color: 'purple', description: 'Yahoo Mail accounts' },
                  { provider: 'other' as const, name: 'Other IMAP', color: 'gray', description: 'Custom IMAP servers' }
                ].map((email) => (
                  <button
                    key={email.provider}
                    onClick={() => connectEmailAccount(email.provider)}
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
                    
                    {isConnecting && connectingProvider === email.provider ? (
                      <div className="flex items-center text-blue-600 text-sm">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Click to connect
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {isConnecting && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-800">
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    <div>
                      <div className="font-medium">Connecting to your email account...</div>
                      <div className="text-sm text-blue-600">You'll be redirected to authorize FilePilot</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
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
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
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

            {/* Supported Providers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Supported Providers</h3>
              </div>
              
              <div className="space-y-2 text-sm text-blue-100">
                <div>✓ Gmail & Google Workspace</div>
                <div>✓ Outlook & Microsoft 365</div>
                <div>✓ Yahoo Mail</div>
                <div>✓ Custom IMAP servers</div>
                <div className="text-xs text-blue-200 mt-3">
                  More providers coming soon
                </div>
              </div>
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