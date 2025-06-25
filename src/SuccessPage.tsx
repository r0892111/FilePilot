import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Check, 
  FileText, 
  Mail, 
  Shield, 
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home
} from 'lucide-react';
import { SubscriptionStatus } from './components/SubscriptionStatus';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function SuccessPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error checking user:', error);
      window.location.href = '/login';
    }
  };

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Simulate Google OAuth flow
      // In a real app, this would redirect to Google OAuth
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful connection
      setConnectionStatus('success');
      setIsConnecting(false);
      
      // After successful auth, redirect to dashboard
      setTimeout(() => {
        // In a real app, redirect to the main dashboard
        alert('Welcome to FilePilot! Your account is now set up and ready to use.');
      }, 2000);
      
    } catch (error) {
      setConnectionStatus('error');
      setIsConnecting(false);
    }
  };

  const retryConnection = () => {
    setConnectionStatus('idle');
    handleGoogleAuth();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          
          <p className="text-xl text-gray-600 mb-2">
            Welcome to FilePilot
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium">
            <Check className="w-4 h-4 mr-2" />
            Your subscription is now active
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left Column - Setup Steps */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 flex flex-col">
            {/* Title Section with Clear Separation */}
            <div className="pb-6 border-b-2 border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get you started</h2>
              <p className="text-sm text-gray-500">Follow these steps to complete your setup</p>
            </div>
            
            {/* Steps Content */}
            <div className="space-y-8 flex-grow flex flex-col justify-evenly">
              {/* Step 1 - Completed */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Complete</h3>
                  <p className="text-sm text-gray-600">Your subscription is now active</p>
                </div>
              </div>

              {/* Step 2 - Current */}
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  connectionStatus === 'success' 
                    ? 'bg-green-100' 
                    : connectionStatus === 'connecting'
                    ? 'bg-blue-100'
                    : connectionStatus === 'error'
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  {connectionStatus === 'success' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : connectionStatus === 'connecting' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : connectionStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect Google Account</h3>
                  <p className="text-sm text-gray-600">
                    {connectionStatus === 'success' 
                      ? 'Successfully connected to your Google account'
                      : connectionStatus === 'connecting'
                      ? 'Connecting to your Google account...'
                      : connectionStatus === 'error'
                      ? 'Failed to connect. Please try again.'
                      : 'Authorize FilePilot to access your Gmail and Drive'
                    }
                  </p>
                </div>
              </div>

              {/* Step 3 - Pending */}
              <div className="flex items-start opacity-50">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-gray-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start Organizing</h3>
                  <p className="text-sm text-gray-600">Begin automatic email attachment processing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Google Authorization */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 flex flex-col">
            {connectionStatus === 'success' ? (
              // Success State
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">All Set! 🚀</h3>
                <p className="text-gray-600 mb-6">
                  Your Google account is connected and FilePilot is ready to start organizing your email attachments.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>What happens next?</strong><br />
                    FilePilot will start scanning your incoming emails and automatically organize attachments in your Google Drive.
                  </p>
                </div>
                <button 
                  onClick={goHome}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : connectionStatus === 'error' ? (
              // Error State
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Connection Failed</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't connect to your Google account. This might be due to a temporary issue or browser settings.
                </p>
                <button 
                  onClick={retryConnection}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            ) : (
              // Default/Connecting State
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
                  {connectionStatus === 'connecting' ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <Mail className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Your Google Account'}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {connectionStatus === 'connecting' 
                    ? 'Please wait while we securely connect to your Google account...'
                    : 'To start organizing your email attachments, we need access to your Gmail and Google Drive.'
                  }
                </p>

                {connectionStatus !== 'connecting' && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left flex-grow">
                      <h4 className="font-semibold text-gray-900 mb-3">We'll request access to:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          Read your Gmail messages and attachments
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          Create and organize folders in Google Drive
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          Upload and manage your documents
                        </li>
                      </ul>
                    </div>

                    <button 
                      onClick={handleGoogleAuth}
                      disabled={isConnecting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center group"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                <span>Your data is encrypted and secure. We never store your emails or documents.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;