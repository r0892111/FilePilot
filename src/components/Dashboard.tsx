import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, 
  Upload,
  FolderOpen,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  User,
  LogOut,
  Crown,
  Zap,
  Shield,
  Settings,
  Plus,
  ArrowRight,
  Mail,
  Target,
  Folder,
  RefreshCw
} from 'lucide-react';
import { OnboardingFlow } from './OnboardingFlow';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

interface DashboardStats {
  totalDocuments: number;
  documentsThisMonth: number;
  categoriesCreated: number;
  storageUsed: string;
}

interface RecentDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  date: string;
  status: 'processed' | 'processing' | 'failed';
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  icon: React.ComponentType<any>;
}

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    documentsThisMonth: 0,
    categoriesCreated: 0,
    storageUsed: '0 MB'
  });
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'email',
      title: 'Connect Email Accounts',
      description: 'Add email accounts to monitor for attachments',
      completed: false,
      action: 'Connect Email',
      icon: Mail
    },
    {
      id: 'folder',
      title: 'Select Organization Folder',
      description: 'Choose where to organize your documents in Google Drive',
      completed: false,
      action: 'Select Folder',
      icon: FolderOpen
    },
    {
      id: 'sync',
      title: 'Start Monitoring',
      description: 'Begin automatic email attachment processing',
      completed: false,
      action: 'Start Sync',
      icon: Zap
    }
  ]);

  useEffect(() => {
    checkUserAndSubscription();
  }, []);

  const checkUserAndSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata
      });

      // Check subscription status
      const { data: subscriptionData, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setIsAuthorized(false);
      } else if (subscriptionData && subscriptionData.subscription_status === 'active') {
        setSubscription(subscriptionData);
        setIsAuthorized(true);
        loadDashboardData();
        checkSetupStatus();
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('Error checking user and subscription:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSetupStatus = () => {
    // Simulate checking setup status
    // In a real app, this would check the database for user's setup progress
    const emailConnected = Math.random() > 0.7;
    const folderSelected = Math.random() > 0.5;
    const syncStarted = emailConnected && folderSelected;
    
    setSetupSteps(prev => prev.map(step => ({
      ...step,
      completed: step.id === 'email' ? emailConnected : 
                 step.id === 'folder' ? folderSelected :
                 step.id === 'sync' ? syncStarted : false
    })));
    
    setSetupComplete(emailConnected && folderSelected && syncStarted);
  };

  const loadDashboardData = async () => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setStats({
        totalDocuments: 1247,
        documentsThisMonth: 89,
        categoriesCreated: 12,
        storageUsed: '2.4 GB'
      });

      setRecentDocuments([
        {
          id: '1',
          name: 'Q4_Financial_Report.pdf',
          type: 'PDF',
          category: 'Finance',
          size: '2.4 MB',
          date: '2 hours ago',
          status: 'processed'
        },
        {
          id: '2',
          name: 'Contract_Amendment.docx',
          type: 'Word',
          category: 'Legal',
          size: '1.1 MB',
          date: '5 hours ago',
          status: 'processed'
        },
        {
          id: '3',
          name: 'Marketing_Presentation.pptx',
          type: 'PowerPoint',
          category: 'Marketing',
          size: '8.7 MB',
          date: '1 day ago',
          status: 'processing'
        },
        {
          id: '4',
          name: 'Invoice_12847.pdf',
          type: 'PDF',
          category: 'Finance',
          size: '156 KB',
          date: '2 days ago',
          status: 'processed'
        },
        {
          id: '5',
          name: 'Project_Specs.xlsx',
          type: 'Excel',
          category: 'Projects',
          size: '3.2 MB',
          date: '3 days ago',
          status: 'failed'
        }
      ]);
    }, 1000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getUserDisplayName = (user: User) => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user.user_metadata?.first_name) {
      const lastName = user.user_metadata.last_name ? ` ${user.user_metadata.last_name}` : '';
      return `${user.user_metadata.first_name}${lastName}`;
    }
    return user.email.split('@')[0];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'excel':
        return <BarChart3 className="w-5 h-5 text-green-500" />;
      case 'powerpoint':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleSetupAction = (stepId: string) => {
    if (stepId === 'email' || stepId === 'folder') {
      setShowOnboarding(true);
    } else if (stepId === 'sync') {
      // Start sync process
      alert('Starting email monitoring...');
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setSetupComplete(true);
    setSetupSteps(prev => prev.map(step => ({ ...step, completed: true })));
    // Refresh dashboard data
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Subscription Required
            </h1>
            
            <p className="text-gray-600 mb-6">
              This dashboard is only available to users with an active subscription. 
              Please upgrade your account to access these features.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/#pricing'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                View Pricing Plans
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">FilePilot</span>
              <div className="ml-4 px-3 py-1 bg-blue-100 rounded-full">
                <div className="flex items-center text-blue-800 text-sm font-medium">
                  <Crown className="w-4 h-4 mr-1" />
                  Pro
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                Welcome, {user ? getUserDisplayName(user) : 'User'}
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user ? getUserDisplayName(user) : 'User'}!
          </h1>
          <p className="text-gray-600">
            {setupComplete 
              ? "Here's what's happening with your document organization today."
              : "Let's finish setting up your account to start organizing your documents."
            }
          </p>
        </div>

        {/* Setup Progress (if not complete) */}
        {!setupComplete && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8 border border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
                <p className="text-gray-600">Finish these steps to start organizing your email attachments</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {setupSteps.filter(s => s.completed).length}/{setupSteps.length}
                </div>
                <div className="text-sm text-gray-500">Steps completed</div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {setupSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 ${
                      step.completed 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        step.completed ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <StepIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        Step {index + 1}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                    
                    {!step.completed && (
                      <button
                        onClick={() => handleSetupAction(step.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        {step.action}
                      </button>
                    )}
                    
                    {step.completed && (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.documentsThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.categoriesCreated}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-3xl font-bold text-gray-900">{stats.storageUsed}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Upload</h3>
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-blue-100 mb-4">
              Drag and drop files or browse to upload documents for automatic organization.
            </p>
            <button 
              onClick={() => window.location.href = '/upload'}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Upload Files
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Browse Drive</h3>
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-green-100 mb-4">
              Access your organized documents directly in Google Drive with smart folder structure.
            </p>
            <button 
              onClick={() => window.location.href = '/browse'}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Browse Files
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Setup Assistant</h3>
              <Settings className="w-6 h-6" />
            </div>
            <p className="text-purple-100 mb-4">
              {setupComplete 
                ? "Manage your email accounts and organization settings."
                : "Complete your setup to start organizing email attachments."
              }
            </p>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              {setupComplete ? 'Manage Settings' : 'Complete Setup'}
            </button>
          </div>
        </div>

        {/* Recent Documents */}
        {setupComplete && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileTypeIcon(doc.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(doc.status)}
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {doc.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Processing Status */}
        {setupComplete && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Processing Active</h3>
                  <p className="text-gray-600">
                    FilePilot is continuously monitoring your email for new attachments to organize.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}