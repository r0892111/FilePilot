import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
  Calendar,
  Tag,
  Download,
  Share2,
  Trash2,
  Star,
  Clock,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
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
  Video,
  Music,
  Archive,
  Code,
  Home,
  Upload as UploadIcon,
} from "lucide-react";
import {
  fetchGoogleDriveFiles,
  fetchGoogleDriveFolderFiles,
} from "../api/googleDrive/driveApi";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Types for Google Drive API format
interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  starred?: boolean;
  shared?: boolean;
  webViewLink?: string;
  downloadLink?: string;
  thumbnailLink?: string;
  // Computed properties
  type?: "folder" | "file";
  children?: DriveItem[];
  path?: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

export function BrowsePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "modified" | "size" | "type">(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: "root", name: "My Drive", path: "/" },
  ]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadGoogleDriveItems = async () => {
      setIsLoading(true);
      try {
        // Get the Google access token from the Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.provider_token;
        if (!accessToken) {
          setItems([]);
          setIsLoading(false);
          return;
        }
        // Fetch files from Google Drive
        const files = await fetchGoogleDriveFiles(accessToken);
        // Map Google Drive files to DriveItem type
        const mappedFiles: DriveItem[] = files.map((file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          parents: file.parents,
          size: file.size,
          modifiedTime: file.modifiedTime || "",
          createdTime: file.createdTime || "",
          starred: file.starred || false,
          shared: file.shared || false,
          webViewLink: file.webViewLink || "",
          downloadLink: file.webContentLink || "",
          thumbnailLink: file.thumbnailLink || "",
          type:
            file.mimeType === "application/vnd.google-apps.folder"
              ? "folder"
              : "file",
          path:
            file.parents && file.parents.length > 0
              ? `/folder/${file.parents[0]}`
              : "/",
        }));
        setItems(mappedFiles);
      } catch (error) {
        setItems([]);
        console.error("Failed to load Google Drive files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoogleDriveItems();
  }, [currentFolderId]);

  const handleSearch = async () => {
    setIsSearching(true);
  };

  const handleFolderClick = async (folder: DriveItem) => {
    if (folder.type !== "folder") return;

    setCurrentFolderId(folder.id);
    setItems(
      await fetchGoogleDriveFolderFiles(
        folder.id,
        (await supabase.auth.getSession()).data?.session?.provider_token || ""
      )
    );
    const newBreadcrumbs = [
      ...breadcrumbs,
      {
        id: folder.id,
        name: folder.name,
        path: `/${folder.name}`,
      },
    ];
    setBreadcrumbs(newBreadcrumbs);
  };

  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    setCurrentFolderId(breadcrumb.id);
    const index = breadcrumbs.findIndex((b) => b.id === breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const getFileIcon = (item: DriveItem) => {
    if (
      item.type === "folder" ||
      item.mimeType === "application/vnd.google-apps.folder"
    ) {
      return <FolderOpen className="w-5 h-5 text-blue-500" />;
    }

    const mimeType = item.mimeType?.toLowerCase() || "";
    if (mimeType.includes("image"))
      return <Image className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes("video"))
      return <Video className="w-5 h-5 text-red-500" />;
    if (mimeType.includes("audio"))
      return <Music className="w-5 h-5 text-green-500" />;
    if (mimeType.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return <FileText className="w-5 h-5 text-green-500" />;
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return <FileText className="w-5 h-5 text-orange-500" />;
    if (mimeType.includes("zip") || mimeType.includes("archive"))
      return <Archive className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "";
    const size = parseInt(bytes);
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const goBack = () => {
    window.location.href = "/dashboard";
  };

  const sortedItems = [...items].sort((a, b) => {
    // Always show folders first
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;

    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "modified":
        comparison =
          new Date(a.modifiedTime || 0).getTime() -
          new Date(b.modifiedTime || 0).getTime();
        break;
      case "size":
        comparison = parseInt(a.size || "0") - parseInt(b.size || "0");
        break;
      case "type":
        comparison = (a.mimeType || "").localeCompare(b.mimeType || "");
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

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
                <span className="text-xl font-bold text-gray-900">
                  FilePilot
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Cloud className="w-4 h-4 mr-2 text-blue-500" />
                Google Drive
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Browse Files</h1>
            <div className="text-sm text-gray-500">{items.length} items</div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortBy("name")}
                className={`p-2 rounded-md transition-colors ${
                  sortBy === "name"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <SortAsc className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => loadItems(currentFolderId)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search files and folders..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  loadItems(currentFolderId);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-3"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
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

        {/* Toolbar */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <Move className="w-4 h-4" />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:text-red-700 transition-colors">
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
              <span className="ml-3 text-gray-600">Loading files...</span>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No files found" : "This folder is empty"}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Upload files or create folders to get started"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className={`group relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    selectedItems.includes(item.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent hover:border-gray-300 hover:shadow-md"
                  }`}
                  onClick={() => {
                    if (item.type === "folder") {
                      handleFolderClick(item);
                    } else {
                      console.log("File clicked:", item);
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

                    <div className="text-xs text-gray-500">
                      {item.type === "file" &&
                        item.size &&
                        formatFileSize(item.size)}
                      {item.type === "folder" && "Folder"}
                    </div>

                    {item.modifiedTime && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(item.modifiedTime)}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle starred status
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.starred ? "fill-yellow-500 text-yellow-500" : ""
                        }`}
                      />
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
                          setSelectedItems(
                            selectedItems.filter((id) => id !== item.id)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  {/* Shared indicator */}
                  {item.shared && (
                    <div className="absolute bottom-2 right-2">
                      <Share2 className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
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
                        checked={
                          selectedItems.length === sortedItems.length &&
                          sortedItems.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(
                              sortedItems.map((item) => item.id)
                            );
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedItems.includes(item.id) ? "bg-blue-50" : ""
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
                              setSelectedItems(
                                selectedItems.filter((id) => id !== item.id)
                              );
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
                                if (item.type === "folder") {
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.type === "file" && item.size
                          ? formatFileSize(item.size)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.modifiedTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.type === "folder"
                            ? "Folder"
                            : item.mimeType?.split("/")[1] || "File"}
                        </span>
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
                            <Share2 className="w-4 h-4" />
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
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => (window.location.href = "/upload")}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <UploadIcon className="w-6 h-6" />
          </button>
        </div>
      </main>
    </div>
  );
}
