import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FileText, 
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
  ArrowRight,
  Mail,
  Target,
  Loader2,
  AlertTriangle,
  FolderOpen,
  HardDrive
} from 'lucide-react';
import { OnboardingStepsPage } from './OnboardingStepsPage';

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

interface DashboardStats {
  totalDocuments: number;
  storageLeft: string;
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
export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    documentsThisMonth: 0,
    categoriesCreated: 0,
    storageUsed: '0 MB'
  });
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
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

      // For now, allow all authenticated users
      setIsAuthorized(true);
      loadDashboardData();
    } catch (error) {
      console.error('Error checking user:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Simulate loading dashboard data with realistic numbers
    setTimeout(() => {
      setStats({
        totalDocuments: 1247,
        storageLeft: '12.6 GB',
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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
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
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-6">
              You don't have access to this dashboard. Please contact support if you believe this is an error.
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
          );
        
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">FilePilot</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                Welcome, {user ? getUserDisplayName(user) : 'User'}
              </div>
              
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
            Here's what's happening with your document organization today.
          </p>
        </div>

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
                <p className="text-sm font-medium text-gray-600">Storage Left</p>
                <p className="text-3xl font-bold text-gray-900">{stats.storageLeft}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-orange-600" />
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Account Settings</h3>
              <Settings className="w-6 h-6" />
            </div>
            <p className="text-purple-100 mb-4">
              Manage your email accounts and organization settings.
            </p>
            <button 
              onClick={() => alert('Settings coming soon!')}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              Settings
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Processing</h3>
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-green-100 mb-4">
              Your AI assistant is actively organizing email attachments.
            </p>
            <div className="flex items-center text-green-200">
              <div className="w-2 h-2 rounded-full mr-2 bg-green-300 animate-pulse"></div>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getFileTypeIcon(doc.type)}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(doc.status)}
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
    
    )
  }
}
    )
  }
}