import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import SuccessPage from './SuccessPage.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { UploadPage } from './components/UploadPage.tsx';
import { BrowsePage } from './components/BrowsePage.tsx';
import { OnboardingStepsPage } from './components/OnboardingStepsPage.tsx';
import { createClient } from '@supabase/supabase-js';
import './index.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Simple client-side routing
const path = window.location.pathname;

const AppComponent = () => {
  const handleAuthSuccess = () => {
    // Redirect to home page after successful authentication
    window.location.href = '/';
  };

  if (path === '/login') {
    return <AuthPage mode="login" onAuthSuccess={handleAuthSuccess} />;
  }
  if (path === '/signup') {
    return <AuthPage mode="signup" onAuthSuccess={handleAuthSuccess} />;
  }
  if (path === '/success') {
    return <SuccessPage />;
  }
  if (path === '/steps') {
    return (
      <OnboardingStepsPage
        onComplete={() => window.location.href = '/dashboard'}
        onClose={() => window.location.href = '/'}
        isSubscribed={true} // Will be determined by the component itself
        mode="setup"
      />
    );
  }
  if (path === '/dashboard') {
    return <Dashboard />;
  }
  if (path === '/upload') {
    return <UploadPage />;
  }
  if (path === '/browse') {
    return <BrowsePage />;
  }
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComponent />
  </StrictMode>
);