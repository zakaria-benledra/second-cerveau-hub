import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Routes where sidebar should auto-collapse
const AUTO_COLLAPSE_ROUTES = ['/focus', '/ai-coach'];

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Auto-collapse sidebar on Focus/AI Coach modes
  useEffect(() => {
    if (AUTO_COLLAPSE_ROUTES.includes(location.pathname) && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, sidebarOpen, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-smooth',
          sidebarOpen ? 'w-64' : 'w-[72px]',
          'hidden md:block'
        )}
      >
        <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-smooth md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-smooth',
          sidebarOpen ? 'md:ml-64' : 'md:ml-[72px]'
        )}
      >
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
