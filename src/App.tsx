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
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
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
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/focus" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
