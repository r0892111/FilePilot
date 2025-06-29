import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  FolderOpen,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  Shield,
  Plus,
  Search,
  Home,
  Folder,
  HardDrive,
  CheckCircle,
  Target,
  AlertTriangle,
} from "lucide-react";
import { fetchGoogleDriveFolders } from "../api/googleDrive/driveApi";
import { triggerCompleteSetupWebhook } from "../api/webhooks"; // Adjust the import path as needed

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DriveFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  children?: DriveFolder[];
  isExpanded?: boolean;
}

interface FolderSetupPageProps {
  onComplete: () => void;
  onBack: () => void;
}

export function FolderSetupPage({ onComplete, onBack }: FolderSetupPageProps) {
  const [user, setUser] = useState<any>(null);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["root"])
  );
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    checkUser();
    loadDriveFolders();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  };

  const loadDriveFolders = async () => {
    setIsLoadingFolders(true);

    try {
      // Get Google access token from Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;
      if (!accessToken) throw new Error("No Google Drive access token found.");

      // Fetch folders from Google Drive
      const folders = await fetchGoogleDriveFolders(accessToken);

      // Map Google Drive folders to DriveFolder[]
      // First, create a map of id -> folder
      const folderMap: { [id: string]: DriveFolder } = {};
      folders.forEach((f: any) => {
        folderMap[f.id] = {
          id: f.id,
          name: f.name,
          path: "", // We'll fill this in next
          parentId:
            f.parents && f.parents.length > 0 ? f.parents[0] : undefined,
          children: [],
        };
      });

      // Build the tree structure
      const rootFolders: DriveFolder[] = [];
      Object.values(folderMap).forEach((folder) => {
        if (folder.parentId && folderMap[folder.parentId]) {
          folderMap[folder.parentId].children!.push(folder);
        } else {
          rootFolders.push(folder);
        }
      });

      // Set the path for each folder recursively
      const setPaths = (folders: DriveFolder[], parentPath: string) => {
        folders.forEach((folder) => {
          folder.path =
            parentPath === ""
              ? `/${folder.name}`
              : `${parentPath}/${folder.name}`;
          if (folder.children && folder.children.length > 0) {
            setPaths(folder.children, folder.path);
          }
        });
      };
      setPaths(rootFolders, "");

      // If you want to show a single "My Drive" root, wrap the tree:
      setDriveFolders([
        {
          id: "root",
          name: "My Drive",
          path: "/",
          children: rootFolders,
        },
      ]);
    } catch (error) {
      console.error("Error loading folders:", error);
      setDriveFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);

    try {
      // Simulate folder creation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newFolder: DriveFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name: newFolderName,
        path: `/FilePilot/${newFolderName}`,
        parentId: "root",
      };

      // Add to the root folder's children
      setDriveFolders((prev) =>
        prev.map((folder) => {
          if (folder.id === "root") {
            return {
              ...folder,
              children: [...(folder.children || []), newFolder],
            };
          }
          return folder;
        })
      );

      setSelectedFolder(newFolder.id);
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const renderFolderTree = (folders: DriveFolder[], level = 0) => {
    return folders
      .filter(
        (folder) =>
          searchQuery === "" ||
          folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((folder) => (
        <div key={folder.id} className="select-none">
          <div
            className={`flex items-center py-3 px-4 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedFolder === folder.id
                ? "bg-blue-100 border-2 border-blue-300 shadow-sm"
                : "hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
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

            <div className="mr-3">
              {folder.id === "root" ? (
                <HardDrive className="w-5 h-5 text-blue-500" />
              ) : (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium text-gray-900">{folder.name}</div>
              <div className="text-xs text-gray-500">{folder.path}</div>
            </div>

            {selectedFolder === folder.id && (
              <CheckCircle className="w-5 h-5 text-blue-600" />
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

  const handleComplete = async () => {
    if (!selectedFolder) {
      alert("Please select a folder to continue.");
      return;
    }

    if (!user) return;

    try {
      // Update the folder step as completed
      const { error } = await supabase.rpc("update_onboarding_step", {
        user_uuid: user.id,
        step_name: "folder",
        completed: true,
      });

      await triggerCompleteSetupWebhook(user.id, user.email, "google", "completed");

      if (error) {
        console.error("Error updating folder step:", error);
        return;
      }

      onComplete();
    } catch (error) {
      console.error("Error completing folder setup:", error);
    }
  };

  const getSelectedFolderInfo = () => {
    const findFolder = (folders: DriveFolder[]): DriveFolder | null => {
      for (const folder of folders) {
        if (folder.id === selectedFolder) return folder;
        if (folder.children) {
          const found = findFolder(folder.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findFolder(driveFolders);
  };

  const selectedFolderInfo = getSelectedFolderInfo();

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
              onClick={onBack}
              className="flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Email Setup
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <FolderOpen className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Select Organization Folder
          </h1>

          <p className="text-xl text-blue-100 mb-6">
            Choose where FilePilot should organize your email attachments in
            Google Drive
          </p>

          <div className="inline-flex items-center px-4 py-2 bg-orange-500/20 rounded-full border border-orange-400/30 text-orange-200 text-sm mb-4">
            <Target className="w-4 h-4 mr-2" />
            This folder will contain all your organized documents
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Folder Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Google Drive Folders
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreateFolder(!showCreateFolder)}
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Folder
                  </button>
                  <button
                    onClick={loadDriveFolders}
                    disabled={isLoadingFolders}
                    className="flex items-center text-gray-600 hover:text-gray-700 transition-colors text-sm"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-1 ${
                        isLoadingFolders ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Create New Folder */}
              {showCreateFolder && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Create New Folder
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name..."
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === "Enter" && createNewFolder()}
                    />
                    <button
                      onClick={createNewFolder}
                      disabled={!newFolderName.trim() || isCreatingFolder}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingFolder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Folder Tree */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                {isLoadingFolders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">
                      Loading your Google Drive folders...
                    </span>
                  </div>
                ) : driveFolders.length > 0 ? (
                  <div className="p-4">{renderFolderTree(driveFolders)}</div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>
                      No folders found. Please make sure you have access to
                      Google Drive.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Folder Info */}
            {selectedFolderInfo && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-200">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Selected Organization Folder
                  </h3>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FolderOpen className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-900">
                      {selectedFolderInfo.name}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 mb-3">
                    Path: {selectedFolderInfo.path}
                  </div>

                  <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center text-orange-800 mb-2">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="font-medium text-sm">Important:</span>
                    </div>
                    <div className="text-xs text-orange-700">
                      All your organized email attachments will be stored in
                      this folder. FilePilot will create organized subfolders
                      here for different document categories.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Aligned with main content */}
          <div className="space-y-6">
            {/* Organization Preview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Folder className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Organization Structure
                </h3>
              </div>

              <div className="space-y-2 text-sm text-blue-100">
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📁 Finance
                </div>
                <div className="flex items-center ml-4">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📄 Invoices
                </div>
                <div className="flex items-center ml-4">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📄 Receipts
                </div>
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📁 Legal
                </div>
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📁 Projects
                </div>
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-2" />
                  📁 Personal
                </div>
              </div>

              <div className="text-xs text-blue-200 mt-3">
                AI will automatically create and organize subfolders based on
                your document types
              </div>
            </div>

            {/* Features */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Safe Organization
                </h3>
              </div>

              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Existing files remain untouched
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  New folders created automatically
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Smart duplicate detection
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  Customizable folder structure
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Home className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Pro Tips</h3>
              </div>

              <ul className="space-y-2 text-sm text-blue-100">
                <li>• Choose a dedicated folder for better organization</li>
                <li>• Create a "FilePilot" folder for easy identification</li>
                <li>• You can change this location later in settings</li>
                <li>• Subfolders will be created automatically</li>
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
            Back to Email Setup
          </button>

          <button
            onClick={handleComplete}
            disabled={!selectedFolder}
            className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            Complete Setup
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
