import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  FolderOpen, 
  FileText, 
  Image, 
  File, 
  MoreHorizontal,
  ArrowLeft,
  ChevronRight,
  Download,
  Share2,
  Trash2,
  Star,
  SortAsc,
  SortDesc,
  Eye,
  Move,
  Copy,
  RefreshCw,
  Cloud,
  HardDrive,
  Smartphone,
  ChevronDown,
  X,
  Plus,
  Folder,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Types for file system items
interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  mimeType?: string;
  modifiedTime: string;
  createdTime: string;
  path: string;
  parentId?: string;
  starred: boolean;
  shared: boolean;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  webViewLink?: string;
  downloadLink?: string;
}

interface CloudProvider {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  connected: boolean;
  totalStorage: string;
  usedStorage: string;
}

interface SearchFilters {
  fileType: string;
  dateRange: string;
  category: string;
  size: string;
  starred: boolean;
  shared: boolean;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

const cloudProviders: CloudProvider[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: Cloud,
    color: '#4285F4',
    connected: true,
    totalStorage: '15 GB',
    usedStorage: '8.2 GB'
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: HardDrive,
    color: '#0078D4',
    connected: false,
    totalStorage: '5 GB',
    usedStorage: '0 GB'
  },
  {
    id: 'icloud',
    name: 'iCloud Drive',
    icon: Smartphone,
    color: '#007AFF',
    connected: false,
    totalStorage: '5 GB',
    usedStorage: '0 GB'
  }
];

export function BrowsePage() {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(cloudProviders[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'My Drive', path: '/' }
  ]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    fileType: 'all',
    dateRange: 'all',
    category: 'all',
    size: 'all',
    starred: false,
    shared: false
  });

  // Data fetching stubs - replace with actual API calls
  const fetchDriveItems = async (path: string, providerId: string): Promise<DriveItem[]> => {
    // TODO: Implement actual API call to fetch drive items
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data based on path
      const mockItems: DriveItem[] = path === '/' ? [
        {
          id: '1',
          name: 'Documents',
          type: 'folder',
          modifiedTime: '2024-01-15T10:30:00Z',
          createdTime: '2024-01-01T09:00:00Z',
          path: '/Documents',
          starred: false,
          shared: false
        },
        {
          id: '2',
          name: 'Financial Report Q4.pdf',
          type: 'file',
          size: 2457600,
          mimeType: 'application/pdf',
          modifiedTime: '2024-01-14T15:45:00Z',
          createdTime: '2024-01-14T15:45:00Z',
          path: '/Financial Report Q4.pdf',
          starred: true,
          shared: false,
          category: 'Finance',
          tags: ['report', 'quarterly']
        },
        {
          id: '3',
          name: 'Project Images',
          type: 'folder',
          modifiedTime: '2024-01-13T12:20:00Z',
          createdTime: '2024-01-10T08:15:00Z',
          path: '/Project Images',
          starred: false,
          shared: true
        },
        {
          id: '4',
          name: 'Marketing Presentation.pptx',
          type: 'file',
          size: 5242880,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          modifiedTime: '2024-01-12T09:15:00Z',
          createdTime: '2024-01-12T09:15:00Z',
          path: '/Marketing Presentation.pptx',
          starred: false,
          shared: true,
          category: 'Marketing',
          tags: ['presentation', 'campaign']
        }
      ] : [
        {
          id: '5',
          name: 'Contracts',
          type: 'folder',
          modifiedTime: '2024-01-10T14:20:00Z',
          createdTime: '2024-01-05T11:30:00Z',
          path: '/Documents/Contracts',
          starred: false,
          shared: false
        },
        {
          id: '6',
          name: 'Meeting Notes.docx',
          type: 'file',
          size: 1048576,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          modifiedTime: '2024-01-09T16:45:00Z',
          createdTime: '2024-01-09T16:45:00Z',
          path: '/Documents/Meeting Notes.docx',
          starred: false,
          shared: false,
          category: 'Business',
          tags: ['meeting', 'notes']
        }
      ];
      
      return mockItems;
    } catch (error) {
      console.error('Error fetching drive items:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchDriveItems = async (query: string, filters: SearchFilters, providerId: string): Promise<DriveItem[]> => {
    // TODO: Implement actual search API call
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults: DriveItem[] = [
        {
          id: 'search1',
          name: 'Contract Agreement.docx',
          type: 'file',
          size: 1024000,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          modifiedTime: '2024-01-12T14:30:00Z',
          createdTime: '2024-01-12T14:30:00Z',
          path: '/Legal/Contract Agreement.docx',
          starred: false,
          shared: true,
          category: 'Legal',
          tags: ['contract', 'agreement']
        },
        {
          id: 'search2',
          name: 'Budget Spreadsheet.xlsx',
          type: 'file',
          size: 2048000,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          modifiedTime: '2024-01-11T10:15:00Z',
          createdTime: '2024-01-11T10:15:00Z',
          path: '/Finance/Budget Spreadsheet.xlsx',
          starred: true,
          shared: false,
          category: 'Finance',
          tags: ['budget', 'finance']
        }
      ];
      
      // Filter results based on query
      return mockResults.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching drive items:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // API stubs for file operations
  const createFolder = async (name: string, parentPath: string, providerId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Creating folder "${name}" in "${parentPath}" on ${providerId}`);
      return true;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  };

  const deleteItems = async (itemIds: string[], providerId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Deleting items ${itemIds.join(', ')} from ${providerId}`);
      return true;
    } catch (error) {
      console.error('Error deleting items:', error);
      return false;
    }
  };

  const toggleStarred = async (itemId: string, starred: boolean, providerId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`${starred ? 'Starring' : 'Unstarring'} item ${itemId} on ${providerId}`);
      return true;
    } catch (error) {
      console.error('Error toggling starred status:', error);
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    if (selectedProvider.connected && !isSearchMode) {
      loadItems();
    }
  }, [selectedProvider, currentPath, isSearchMode]);

  const loadItems = async () => {
    const fetchedItems = await fetchDriveItems(currentPath, selectedProvider.id);
    setItems(fetchedItems);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      loadItems();
      return;
    }
    
    setIsSearchMode(true);
    const results = await searchDriveItems(searchQuery, searchFilters, selectedProvider.id);
    setItems(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setShowFilters(false);
    loadItems();
  };

  const handleFolderClick = (folder: DriveItem) => {
    if (isSearchMode) return; // Don't navigate in search mode
    
    const newPath = folder.path;
    setCurrentPath(newPath);
    
    const newBreadcrumbs = [...breadcrumbs, {
      id: folder.id,
      name: folder.name,
      path: newPath
    }];
    setBreadcrumbs(newBreadcrumbs);
  };

  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    if (isSearchMode) return; // Don't navigate in search mode
    
    setCurrentPath(breadcrumb.path);
    const index = breadcrumbs.findIndex(b => b.id === breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.type === 'folder') {
      return <FolderOpen className="w-5 h-5 text-blue-500" />;
    }
    
    const mimeType = item.mimeType?.toLowerCase() || '';
    if (mimeType.includes('image')) return <Image className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('presentation')) return <FileText className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  if (!selectedProvider.connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Cloud className="w-8 h-8 text-yellow-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Drive
            </h1>
            
            <p className="text-gray-600 mb-6">
              Please connect to a cloud storage provider to browse and search your files.
            </p>
            
            <button
              onClick={() => window.location.href = '/upload'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Connect Storage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">FilePilot</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {isSearchMode ? 'Search Results' : 'Browse Files'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Provider Info & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <selectedProvider.icon 
                className="w-6 h-6 mr-2" 
                style={{ color: selectedProvider.color }}
              />
              <span className="font-semibold text-gray-900">{selectedProvider.name}</span>
            </div>
            <div className="text-sm text-gray-500">
              {selectedProvider.usedStorage} of {selectedProvider.totalStorage} used
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={isSearchMode ? clearSearch : loadItems}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={isSearchMode ? 'Clear search' : 'Refresh'}
            >
              {isSearchMode ? <X className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Unified Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={isSearchMode ? "Search across all files..." : "Search files and folders..."}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
                showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Search Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                  <select
                    value={searchFilters.fileType}
                    onChange={(e) => setSearchFilters({...searchFilters, fileType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="documents">Documents</option>
                    <option value="images">Images</option>
                    <option value="presentations">Presentations</option>
                    <option value="spreadsheets">Spreadsheets</option>
                    <option value="folders">Folders</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Modified</label>
                  <select
                    value={searchFilters.dateRange}
                    onChange={(e) => setSearchFilters({...searchFilters, dateRange: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={searchFilters.category}
                    onChange={(e) => setSearchFilters({...searchFilters, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="finance">Finance</option>
                    <option value="legal">Legal</option>
                    <option value="marketing">Marketing</option>
                    <option value="business">Business</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Size</label>
                  <select
                    value={searchFilters.size}
                    onChange={(e) => setSearchFilters({...searchFilters, size: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Any Size</option>
                    <option value="small">Small (< 1MB)</option>
                    <option value="medium">Medium (1-10MB)</option>
                    <option value="large">Large (> 10MB)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.starred}
                    onChange={(e) => setSearchFilters({...searchFilters, starred: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Starred only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.shared}
                    onChange={(e) => setSearchFilters({...searchFilters, shared: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Shared files only</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Search Mode Indicator */}
        {isSearchMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Search className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Search results for "{searchQuery}"
                  </p>
                  <p className="text-xs text-blue-700">
                    {items.length} result{items.length !== 1 ? 's' : ''} found across all folders
                  </p>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumbs (only in browse mode) */}
        {!isSearchMode && (
          <div className="flex items-center space-x-2 mb-6">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.id}>
                <button
                  onClick={() => handleBreadcrumbClick(breadcrumb)}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {breadcrumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Selection Toolbar */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="Move">
                  <Move className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="Copy">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:text-red-700 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Grid/List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {isSearchMode ? 'Searching...' : 'Loading files...'}
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              {isSearchMode ? (
                <>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search and browse files
                  </button>
                </>
              ) : (
                <>
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
                  <p className="text-gray-600">
                    Upload files or create folders to get started
                  </p>
                </>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`group relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    selectedItems.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (item.type === 'folder' && !isSearchMode) {
                      handleFolderClick(item);
                    } else {
                      console.log('File clicked:', item);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      {getFileIcon(item)}
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {item.name}
                    </h3>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {item.type === 'file' && item.size && formatFileSize(item.size)}
                      {item.type === 'folder' && 'Folder'}
                    </div>
                    
                    {/* Show path in search mode */}
                    {isSearchMode && (
                      <div className="text-xs text-gray-400 mb-2 truncate" title={item.path}>
                        {item.path}
                      </div>
                    )}
                    
                    {item.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarred(item.id, !item.starred, selectedProvider.id);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${item.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                  </div>
                  
                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Status indicators */}
                  <div className="absolute bottom-2 right-2 flex space-x-1">
                    {item.starred && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                    {item.shared && (
                      <Share2 className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === items.length && items.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(items.map(item => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    {isSearchMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(item)}
                          <div className="ml-3">
                            <button
                              onClick={() => {
                                if (item.type === 'folder' && !isSearchMode) {
                                  handleFolderClick(item);
                                }
                              }}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {item.name}
                            </button>
                            <div className="flex items-center mt-1">
                              {item.starred && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                              )}
                              {item.shared && (
                                <Share2 className="w-3 h-3 text-blue-500 mr-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {isSearchMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.path}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.type === 'file' && item.size ? formatFileSize(item.size) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.modifiedTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="More">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {!isSearchMode && (
          <div className="fixed bottom-8 right-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}