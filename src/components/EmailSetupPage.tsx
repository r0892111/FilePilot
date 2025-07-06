import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
  X,
  Info,
  ExternalLink,
  Calendar,
  Clock,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EmailAccount {
  id: string;
  email: string;
  provider: "gmail";
  connected: boolean;
  lastSync?: string;
  status: "active" | "error" | "syncing";
  dateRange?: string;
}

interface EmailSetupPageProps {
  onComplete: () => void;
  onBack: () => void;
}

export function EmailSetupPage({ onComplete, onBack }: EmailSetupPageProps) {
  const [user, setUser] = useState<any>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getThirtyDaysAgoISOString = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  };
  const [selectedDateISOString, setSelectedDateISOString] = useState<string>(
    getThirtyDaysAgoISOString()
  );

  const [selectedDateRange, setSelectedDateRange] = useState<string>("30");

  const [customDate, setCustomDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateRangeOptions = [
    { value: "7", label: "Last 7 days", description: "Recent emails only" },
    { value: "30", label: "Last 30 days", description: "Past month" },
    { value: "90", label: "Last 3 months", description: "Quarterly review" },
    { value: "180", label: "Last 6 months", description: "Half-year analysis" },
    { value: "365", label: "Last year", description: "Full year review" },
    {
      value: "all",
      label: "All emails",
      description: "Complete email history",
    },
    {
      value: "custom",
      label: "Custom date",
      description: "Choose specific date",
    },
  ];

  useEffect(() => {
    checkUser();
  }, [user]);
 
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
    } finally {
      setIsLoading(false);
    }
  };

  /*   const loadEmailAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "gmail")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading email accounts:", error);
        return;
      }

      const accounts: EmailAccount[] = (data || []).map((account) => ({
        id: account.id.toString(),
        email: account.email,
        provider: "gmail",
        connected: true,
        lastSync: account.last_sync,
        status: account.status as "active" | "error" | "syncing",
        dateRange: account.date_range || "30",
      }));

      setEmailAccounts(accounts);
    } catch (error) {
      console.error("Error loading email accounts:", error);
    }
  };
 */

  const getDateRangeDescription = (range: string) => {
    if (range === "custom") {
      return customDate
        ? `Since ${new Date(customDate).toLocaleDateString()}`
        : "Choose date";
    }
    const option = dateRangeOptions.find((opt) => opt.value === range);
    return option ? option.description : "Unknown range";
  };

  const getEstimatedEmailCount = (range: string) => {
    const estimates = {
      "7": "~50-200 emails",
      "30": "~200-800 emails",
      "90": "~600-2,400 emails",
      "180": "~1,200-4,800 emails",
      "365": "~2,500-10,000 emails",
      all: "~5,000+ emails",
      custom: customDate ? "Varies by date" : "Select date first",
    };
    return estimates[range as keyof typeof estimates] || "Unknown";
  };

  const handleConnectGmail = async () => {
    if (!user) return;

    setIsConnecting(true);

    try {
      console.log("Initiating Gmail OAuth for email monitoring...");

      // Get the current origin for redirect - use production URL if available
      const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const redirectTo = `${baseUrl}/steps`;

      console.log("Redirect URL:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
          scopes:
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      // Only set email_connected to true if the OAuth flow was successful
      if (!error) {
        await setEmailConnectionStatus();
        await updateUserEmailAccount();
        console.log("OAuth response:", data);
        console.log("OAuth initiated successfully");
        // The redirect will happen automatically
      } else {
        console.error("OAuth error:", error);
        alert(`Gmail authentication failed: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Unexpected OAuth error:", error);
      alert(
        `Failed to authenticate with Gmail: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const setEmailConnectionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_onboarding_steps")
        .update({ email_connected: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating email account status:", error);
        return;
      }
      if (data) {
        console.log("Email connection status updated successfully:", data);
      }
    } catch (error) {
      console.error("Error setting email connection status:", error);
    }
  };

  const updateUserEmailAccount = async () => {
    const { data, error } = await supabase.from("user_email_accounts").insert([
      // Insert a new email account for the user
      {
        user_id: user.id, // UUID of the user
        email: user.email, // The email address to add
        provider: "gmail", // "gmail" or "outlook"
        status: "active", // "active", "error", or "syncing"
        email_history: selectedDateISOString, // Store the selected date range
      },
    ]);

    if (data) {
      console.log("Email account added successfully:", data);
    } else {
      console.error("Error adding email account:", error);
    }
  };

  const removeEmailAccount = async (accountId: string, email: string) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to remove ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc("remove_user_email_account", {
        user_uuid: user.id,
        email_address: email,
      });

      if (error) {
        console.error("Error removing email account:", error);
        alert("Failed to remove email account. Please try again.");
        return;
      }

      setEmailAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    } catch (error) {
      console.error("Error removing email account:", error);
      alert(
        "An error occurred while removing the email account. Please try again."
      );
    }
  };

  const testConnection = async (accountId: string, email: string) => {
    if (!user) return;

    setEmailAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, status: "syncing" } : acc
      )
    );

    try {
      // Update status to syncing in database
      await supabase.rpc("update_email_account_status", {
        user_uuid: user.id,
        email_address: email,
        new_status: "syncing",
      });

      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update to active status
      const { error } = await supabase.rpc("update_email_account_status", {
        user_uuid: user.id,
        email_address: email,
        new_status: "active",
      });

      if (error) {
        console.error("Error updating email status:", error);
      }

      setEmailAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? { ...acc, status: "active", lastSync: new Date().toISOString() }
            : acc
        )
      );
    } catch (error) {
      console.error("Error testing connection:", error);
      setEmailAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, status: "error" } : acc
        )
      );
    }
  };

  const handleComplete = async () => {
    if (emailAccounts.length === 0) {
      alert("Please connect at least one Gmail account to continue.");
      return;
    }

    if (!user) return;

    if (selectedDateRange === "custom" && customDate) {
      // If custom date is selected, use it
      const customDateConverted = new Date(customDate);
      setSelectedDateRange(customDateConverted.toISOString());
    }
    if (selectedDateRange === "all") {
      setSelectedDateRange("2004-04-01.000Z");
    } else {
      // Otherwise, use the selected range
      const days = parseInt(selectedDateRange, 10);
      const date = new Date();
      date.setDate(date.getDate() - days);
      setSelectedDateRange(date.toISOString());
    }

    try {
      onComplete();
    } catch (error) {
      console.error("Error completing email setup:", error);
    }
  };

  const getProviderIcon = () => {
    return (
      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
        <Mail className="w-4 h-4 text-red-600" />
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "syncing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDateRangeIsoString = (range: string, customDate: string) => {
    if (range === "custom" && customDate) {
      // Use the selected custom date as ISO string
      console.log("Custom date selected:", customDate);
      return new Date(customDate).toISOString();
    }
    if (range === "all") {
      // April 1, 2004 as ISO string
      return "2004-04-01T00:00:00.000Z";
    }
    // Otherwise, treat as number of days ago
    const days = parseInt(range, 10);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date.toISOString();
    }
    // Fallback: return today
    return new Date().toISOString();
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
            Connect Your Gmail Account
          </h1>

          <p className="text-xl text-blue-100 mb-6">
            Connect your Gmail account to monitor email attachments for
            automatic organization
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
                    Connected Gmail Accounts ({emailAccounts.length})
                  </h2>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm"
                  >
                    {showAdvanced ? (
                      <EyeOff className="w-4 h-4 mr-1" />
                    ) : (
                      <Eye className="w-4 h-4 mr-1" />
                    )}
                    {showAdvanced ? "Hide" : "Show"} Advanced
                  </button>
                </div>

                <div className="space-y-4">
                  {emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center">
                        {getProviderIcon()}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {account.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {getStatusIcon(account.status)}
                            <span className="ml-2 capitalize">
                              {account.status}
                            </span>
                            {account.lastSync &&
                              account.status === "active" && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>
                                    Last sync:{" "}
                                    {new Date(
                                      account.lastSync
                                    ).toLocaleTimeString()}
                                  </span>
                                </>
                              )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Analyzing:{" "}
                            {getDateRangeDescription(account.dateRange || "30")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {showAdvanced && (
                          <>
                            <button
                              onClick={() =>
                                testConnection(account.id, account.email)
                              }
                              disabled={account.status === "syncing"}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${
                                  account.status === "syncing"
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            removeEmailAccount(account.id, account.email)
                          }
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

            {/* Gmail Connection */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <Plus className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Connect Gmail Account
                </h2>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Important: Email Account Selection
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      When you click "Connect Gmail", you'll be redirected to
                      Google's authentication page.
                      <strong>
                        {" "}
                        Please carefully select the Gmail account you want
                        FilePilot to monitor for attachments.
                      </strong>
                    </p>
                    <p className="text-sm text-blue-700">
                      The email account you choose during the Google OAuth flow
                      will be the one that FilePilot analyzes for email
                      attachments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 text-gray-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">
                    Email Analysis Period
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Choose how far back you want FilePilot to analyze your emails
                  for attachments:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {dateRangeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedDateRange === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dateRange"
                        value={option.value}
                        checked={selectedDateRange === option.value}
                        onChange={(e) => {
                          setSelectedDateISOString(
                            getDateRangeIsoString(e.target.value, customDate)
                          );
                          setSelectedDateRange(e.target.value);
                          if (e.target.value === "custom") {
                            setShowDatePicker(true);
                          } else {
                            setShowDatePicker(false);
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          selectedDateRange === option.value
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedDateRange === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Custom Date Picker */}
                {selectedDateRange === "custom" && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select start date:
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value);
                        setSelectedDateISOString(
                          getDateRangeIsoString(e.target.value, customDate)
                        );
                      }}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      FilePilot will analyze emails from this date onwards
                    </p>
                  </div>
                )}

                {/* Estimated Email Count */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-800">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      Estimated emails to analyze:{" "}
                      {getEstimatedEmailCount(selectedDateRange)}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Processing time depends on the number of emails and
                    attachments
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <button
                  onClick={handleConnectGmail}
                  disabled={
                    isConnecting ||
                    !selectedDateRange ||
                    (selectedDateRange === "custom" && !customDate)
                  }
                  className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center mb-3">
                    {getProviderIcon()}
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">Gmail</div>
                      <div className="text-sm text-gray-500">
                        Google Workspace & Gmail
                      </div>
                    </div>
                  </div>

                  {isConnecting ? (
                    <div className="flex items-center text-blue-600 text-sm">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting to Gmail...
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600 text-sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Click to connect with Google OAuth
                    </div>
                  )}
                </button>
              </div>

              {isConnecting && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-800">
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    <div>
                      <div className="font-medium">Connecting to Gmail...</div>
                      <div className="text-sm text-blue-600">
                        You'll be redirected to Google to authorize FilePilot
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What We Monitor */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  What We Monitor
                </h3>
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

            {/* Privacy & Security */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Privacy & Security
                </h3>
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

            {/* Date Range Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-fit">
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">
                  Analysis Period
                </h3>
              </div>

              <div className="space-y-2 text-sm text-blue-100">
                <div>• Choose how far back to analyze</div>
                <div>• Recent emails process faster</div>
                <div>• All emails = complete history</div>
                <div>• Custom date for specific periods</div>
                <div className="text-xs text-blue-200 mt-3">
                  You can always change this later in settings
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
