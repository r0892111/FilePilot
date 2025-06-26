import React, { useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Check, 
  AlertCircle, 
  Cloud, 
  HardDrive,
  Smartphone,
  ChevronDown,
  Plus,
  Trash2,
  Eye,
  Download,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  CheckCircle2
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CloudProvider {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  connected: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  category?: string;
  destination?: string;
  error?: string;
}

const cloudProviders: CloudProvider[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: Cloud,
    color: '#4285F4',
    description: 'Organize in your Google Drive folders',
    connected: true
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: HardDrive,
    color: '#0078D4',
    description: 'Save to Microsoft OneDrive',
    connected: false
  },
  {
    id: 'icloud',
    name: 'iCloud Drive',
    icon: Smartphone,
    color: '#007AFF',
    description: 'Store in Apple iCloud Drive',
    connected: false
  }
];

export function UploadPage() {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(cloudProviders[0]);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    if (!selectedProvider.connected) {
      alert(`Please connect to ${selectedProvider.name} first to upload files.`);
      return;
    }

    setIsUploading(true);
    
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload process
    for (const uploadFile of newFiles) {
      await simulateUpload(uploadFile);
    }

    setIsUploading(false);
  };

  const simulateUpload = async (uploadFile: UploadedFile) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress }
            : f
        )
      );
    }

    // Simulate processing
    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing', progress: 100 }
          : f
      )
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate completion with AI categorization
    const categories = ['Finance', 'Legal', 'Marketing', 'Projects', 'Personal'];
    const destinations = [
      '/Documents/Finance/2024',
      '/Documents/Legal/Contracts',
      '/Documents/Marketing/Campaigns',
      '/Documents/Projects/Q4',
      '/Documents/Personal'
    ];

    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed',
              category: categories[Math.floor(Math.random() * categories.length)],
              destination: destinations[Math.floor(Math.random() * destinations.length)]
            }
          : f
      )
    );
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return <Image className="w-5 h-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const connectProvider = async (provider: CloudProvider) => {
    // Simulate connection process
    alert(`Connecting to ${provider.name}... This would redirect to OAuth flow in a real app.`);
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

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
                Upload & Organize
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Files
          </h1>
          <p className="text-gray-600">
            Upload your documents and let AI organize them automatically in your preferred cloud storage.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cloud Provider Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Destination
              </h2>
              
              <div className="relative">
                <button
                  onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center">
                    <selectedProvider.icon 
                      className="w-6 h-6 mr-3" 
                      style={{ color: selectedProvider.color }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{selectedProvider.name}</div>
                      <div className="text-sm text-gray-500">{selectedProvider.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {selectedProvider.connected ? (
                      <div className="flex items-center text-green-600 mr-3">
                        <Check className="w-4 h-4 mr-1" />
                        <span className="text-sm">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400 mr-3">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Not connected</span>
                      </div>
                    )}
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {isProviderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {cloudProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          if (provider.connected) {
                            setSelectedProvider(provider);
                            setIsProviderDropdownOpen(false);
                          } else {
                            connectProvider(provider);
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="flex items-center">
                          <provider.icon 
                            className="w-6 h-6 mr-3" 
                            style={{ color: provider.color }}
                          />
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{provider.name}</div>
                            <div className="text-sm text-gray-500">{provider.description}</div>
                          </div>
                        </div>
                        {provider.connected ? (
                          <div className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            <span className="text-sm">Connected</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              connectProvider(provider);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Connect
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Documents
              </h2>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : selectedProvider.connected
                    ? 'border-gray-300 hover:border-gray-400'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    selectedProvider.connected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`w-8 h-8 ${
                      selectedProvider.connected ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragOver ? 'Drop files here' : 'Drag and drop files'}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    or click to browse your computer
                  </p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedProvider.connected}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedProvider.connected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Choose Files
                  </button>
                  
                  {!selectedProvider.connected && (
                    <p className="text-sm text-red-600 mt-3">
                      Please connect to {selectedProvider.name} first
                    </p>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
              />

              <div className="mt-4 text-sm text-gray-500">
                <p>Supported formats: PDF, Word, Excel, PowerPoint, Images, Text files</p>
                <p>Maximum file size: 50MB per file</p>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Uploaded Files ({uploadedFiles.length})
                    </h2>
                    <button
                      onClick={() => setUploadedFiles([])}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {uploadedFiles.map((uploadFile) => (
                    <div key={uploadFile.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          {getFileIcon(uploadFile.file)}
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {uploadFile.file.name}
                              </p>
                              <div className="ml-2">
                                {getStatusIcon(uploadFile.status)}
                              </div>
                            </div>
                            <div className="flex items-center mt-1">
                              <p className="text-sm text-gray-500">
                                {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              {uploadFile.category && (
                                <>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {uploadFile.category}
                                  </span>
                                </>
                              )}
                              {uploadFile.destination && (
                                <>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">
                                    {uploadFile.destination}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {uploadFile.status === 'uploading' && (
                              <div className="mt-2">
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadFile.progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploading... {uploadFile.progress}%
                                </p>
                              </div>
                            )}
                            
                            {uploadFile.status === 'processing' && (
                              <p className="text-xs text-yellow-600 mt-1">
                                AI is analyzing and categorizing...
                              </p>
                            )}
                            
                            {uploadFile.status === 'completed' && (
                              <p className="text-xs text-green-600 mt-1">
                                Successfully organized in {selectedProvider.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {uploadFile.status === 'completed' && (
                            <>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Features */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI-Powered Organization</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Automatic document categorization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Smart folder organization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Duplicate detection
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Metadata extraction
                </li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  End-to-end encryption
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  No permanent storage
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  GDPR compliant
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Secure OAuth connections
                </li>
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Files processed</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {uploadedFiles.filter(f => f.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currently uploading</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {uploadedFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage provider</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedProvider.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}