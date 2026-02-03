import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingProvider } from "@/components/onboarding";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useUserProfile } from "@/hooks/useUserProfile";
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

// Pages essentielles
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import HabitsPage from "./pages/HabitsPage";
import JournalPage from "./pages/JournalPageSimplified";
import ProgramPage from "./pages/ProgramPage";
import FinancePage from "./pages/FinancePageSimplified";
import AchievementsPage from "./pages/AchievementsPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

// Inner component that can use hooks
function AppContent() {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (profile && !profile.onboarding_completed && !profileLoading) {
      setShowOnboarding(true);
    }
  }, [profile, profileLoading]);

  return (
    <>
      <WelcomeModal 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      <OnboardingProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected - 8 pages essentielles */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/program" element={<ProtectedRoute><ProgramPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* Redirections pour anciennes URLs */}
          <Route path="/identity" element={<Navigate to="/dashboard" replace />} />
          <Route path="/identity/details" element={<Navigate to="/dashboard" replace />} />
          <Route path="/today" element={<Navigate to="/dashboard" replace />} />
          <Route path="/kanban" element={<Navigate to="/tasks" replace />} />
          <Route path="/goals" element={<Navigate to="/program" replace />} />
          <Route path="/ai-coach" element={<Navigate to="/dashboard" replace />} />
          <Route path="/scores" element={<Navigate to="/achievements" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </OnboardingProvider>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsProvider>
          <AppContent />
        </AnalyticsProvider>
      </BrowserRouter>
      <OfflineIndicator />
      <InstallPrompt />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
