import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingProvider } from "@/components/onboarding";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "./pages/AuthPage";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";
import KanbanPage from "./pages/KanbanPage";
import HabitsPage from "./pages/HabitsPage";
import InboxPage from "./pages/InboxPage";

import ProjectsPage from "./pages/ProjectsPage";
import GoalsPage from "./pages/GoalsPage";
import FocusPage from "./pages/FocusPage";
import LearningPage from "./pages/LearningPage";
import FinancePage from "./pages/FinancePage";
import JournalPage from "./pages/JournalPage";
import AgentPage from "./pages/AgentPage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import RoutinesPage from "./pages/RoutinesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ScoresPage from "./pages/ScoresPage";
import AutomationPage from "./pages/AutomationPage";
import AICoachPage from "./pages/AICoachPage";
import QADashboardPage from "./pages/QADashboardPage";
import HistoryPage from "./pages/HistoryPage";
import IntelligenceHubPage from "./pages/IntelligenceHubPage";
import ObservabilityPage from "./pages/ObservabilityPage";
import ProductIntelligencePage from "./pages/ProductIntelligencePage";
import AIInterventionsPage from "./pages/AIInterventionsPage";
import IdentityDashboard from "./pages/IdentityDashboard";
import BehaviorHubPage from "./pages/BehaviorHubPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";

// BI Dashboards
import {
  ExecutiveDashboardPage,
  BehaviorTrendsPage,
  FinancialHealthPage,
  HabitStabilityPage,
  DecisionImpactPage,
} from "./pages/bi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OnboardingProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><IdentityDashboard /></ProtectedRoute>} />
            <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
            <Route path="/routines" element={<ProtectedRoute><RoutinesPage /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
            
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
            <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
            <Route path="/intelligence" element={<ProtectedRoute><IntelligenceHubPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><AutomationPage /></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute><AgentPage /></ProtectedRoute>} />
            <Route path="/ai-coach" element={<ProtectedRoute><AICoachPage /></ProtectedRoute>} />
            <Route path="/qa" element={<ProtectedRoute><QADashboardPage /></ProtectedRoute>} />
            <Route path="/observability" element={<ProtectedRoute><ObservabilityPage /></ProtectedRoute>} />
            <Route path="/product-intelligence" element={<ProtectedRoute><ProductIntelligencePage /></ProtectedRoute>} />
            <Route path="/ai-interventions" element={<ProtectedRoute><AIInterventionsPage /></ProtectedRoute>} />
            <Route path="/behavior-hub" element={<ProtectedRoute><BehaviorHubPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* BI Dashboards */}
            <Route path="/bi/executive" element={<ProtectedRoute><AppLayout><ExecutiveDashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/bi/behavior-trends" element={<ProtectedRoute><AppLayout><BehaviorTrendsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/bi/financial-health" element={<ProtectedRoute><AppLayout><FinancialHealthPage /></AppLayout></ProtectedRoute>} />
            <Route path="/bi/habit-stability" element={<ProtectedRoute><AppLayout><HabitStabilityPage /></AppLayout></ProtectedRoute>} />
            <Route path="/bi/decision-impact" element={<ProtectedRoute><AppLayout><DecisionImpactPage /></AppLayout></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
