import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  FileText,
  Mail,
  Search,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Star,
  Users,
  Clock,
  Lock,
  ChevronRight,
  Play,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";
import { stripeProducts } from "./stripe-config";
import { SubscriptionStatus } from "./components/SubscriptionStatus";
import { IntegrationSlider } from "./components/IntegrationSlider";
import { OnboardingFlow } from "./components/OnboardingFlow";

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

function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    checkUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          user_metadata: session.user.user_metadata,
        });
        checkSubscription(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSubscription(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          user_metadata: session.user.user_metadata,
        });
        await checkSubscription(session.user.id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async (userId: string) => {
    try {
      const { data: subscriptionData, error } = await supabase
        .from("stripe_user_subscriptions")
        .select(
          "subscription_status, price_id, current_period_end, cancel_at_period_end"
        )
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
      } else {
        setSubscription(subscriptionData);
        
        // If user has active subscription, redirect to steps page
        if (subscriptionData && subscriptionData.subscription_status === 'active') {
          window.location.href = '/steps';
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(null);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      // Redirect to signup if not authenticated
      window.location.href = "/signup";
      return;
    }

    // Check if user has active subscription
    if (subscription && subscription.subscription_status === "active") {
      // User has subscription, go to steps page
      window.location.href = "/steps";
    } else {
      // User needs to subscribe, show onboarding flow
      setShowOnboarding(true);
    }
  };

  // Helper function to get user's display name
  const getUserDisplayName = (user: User) => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user.user_metadata?.first_name) {
      const lastName = user.user_metadata.last_name
        ? ` ${user.user_metadata.last_name}`
        : "";
      return `${user.user_metadata.first_name}${lastName}`;
    }
    // Fallback to email username (part before @)
    return user.email.split("@")[0];
  };

  const hasActiveSubscription =
    subscription && subscription.subscription_status === "active";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            // After payment completion, redirect to success page
            window.location.href = "/success";
          }}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Header */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-white mr-3" />
              <span className="text-xl font-bold text-white">FilePilot</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden sm:block">
                    <SubscriptionStatus />
                  </div>
                  <div className="flex items-center space-x-4">
                    {hasActiveSubscription && (
                      <a
                        href="/dashboard"
                        className="flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Dashboard
                      </a>
                    )}
                    <div className="flex items-center text-white">
                      <User className="w-5 h-5 mr-2 text-white/80" />
                      <span className="text-sm font-medium">
                        Welcome, {getUserDisplayName(user)}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <a
                    href="/login"
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                  >
                    Sign in
                  </a>
                  <a
                    href="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get started
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Now available worldwide
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Your digital copilot for{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  smart document management
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                FilePilot automatically scans and organizes your email
                attachments in Google Drive with AI precision. Never search for
                important documents again.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center"
                >
                  {hasActiveSubscription ? (
                    <>
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Go to Dashboard
                    </>
                  ) : (
                    <>Get Started Now</>
                  )}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>

                <button className="group border-2 border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center hover:bg-white/5">
                  <Play className="w-5 h-5 mr-2" />
                  Watch demo
                </button>
              </div>
            </div>

            <div
              className={`transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center text-sm font-medium text-gray-600">
                      FilePilot Dashboard
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Contract_Q4_2024.pdf
                        </div>
                        <div className="text-xs text-gray-500">
                          Automatically categorized as Contract
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Mail className="w-5 h-5 text-green-600 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Invoice_12345.pdf
                        </div>
                        <div className="text-xs text-gray-500">
                          Saved to /Finance/2024
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Presentation_Meeting.pptx
                        </div>
                        <div className="text-xs text-gray-500">
                          Moved to /Projects/Q4
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Live AI Processing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FilePilot works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In just three simple steps, transform your chaotic email
              attachments into an organized archive
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Plan",
                description:
                  "Select the subscription plan that fits your needs. Secure payment with Stripe.",
                icon: Mail,
                color: "blue",
              },
              {
                step: "02",
                title: "Connect Email & Drive",
                description:
                  "Link your email accounts and select your Google Drive organization folder.",
                icon: Zap,
                color: "green",
              },
              {
                step: "03",
                title: "AI Organizes Everything",
                description:
                  "Our AI automatically categorizes and organizes your email attachments in real-time.",
                icon: FileText,
                color: "purple",
              },
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-${item.color}-100 rounded-xl mb-6`}
                  >
                    <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                  </div>

                  <div className="text-sm font-semibold text-gray-400 mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start organizing your documents today with our flexible pricing options
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {stripeProducts.map((product, index) => (
              <div
                key={product.id}
                className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                  index === 1
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105 relative'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      <Star className="w-4 h-4 inline mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{product.price}</div>
                  <div className="text-gray-500 mb-4">per {product.interval}</div>
                  
                  {index === 1 && (
                    <div className="text-sm text-green-600 font-medium mb-4">Save 2 months!</div>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8">
                  {product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/signup";
                    } else {
                      setShowOnboarding(true);
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-colors ${
                    index === 1
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {user ? 'Get Started' : 'Sign Up & Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Slider Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Seamlessly integrates with your favorite tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect FilePilot with the platforms you already use. Our growing
              ecosystem of integrations ensures your workflow stays
              uninterrupted.
            </p>
          </div>

          <IntegrationSlider />

          <div className="flex justify-center items-center mt-12 space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-semibold">1000+</span> users
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-semibold">100,000+</span> documents
              processed
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-semibold">4.9/5</span> satisfaction
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Footer */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Security & Compliance
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-800 px-3 py-2 rounded-lg text-sm border border-slate-700">
                  <Lock className="w-4 h-4 inline mr-2" />
                  SOC 2 Type II
                </div>
                <div className="bg-slate-800 px-3 py-2 rounded-lg text-sm border border-slate-700">
                  <Shield className="w-4 h-4 inline mr-2" />
                  GDPR Compliant
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Integrations</h3>
              <div className="flex flex-wrap gap-4 opacity-70">
                <div className="bg-slate-800 px-4 py-2 rounded text-sm">
                  Google
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded text-sm">
                  OpenAI
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded text-sm">
                  Stripe
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy Promise</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                We never store your documents. Only metadata is processed for
                organization. Your privacy is our priority.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 FilePilot. All rights reserved.
              <span className="mx-4">•</span>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <span className="mx-4">•</span>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;