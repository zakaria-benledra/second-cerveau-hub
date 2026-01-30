import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";
import HabitsPage from "./pages/HabitsPage";
import InboxPage from "./pages/InboxPage";
import DashboardPage from "./pages/DashboardPage";
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
import NotFound from "./pages/NotFound";

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
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/routines" element={<ProtectedRoute><RoutinesPage /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
          <Route path="/automation" element={<ProtectedRoute><AutomationPage /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><AgentPage /></ProtectedRoute>} />
          <Route path="/ai-coach" element={<ProtectedRoute><AICoachPage /></ProtectedRoute>} />
          <Route path="/qa" element={<ProtectedRoute><QADashboardPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
