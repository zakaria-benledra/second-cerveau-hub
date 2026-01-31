import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/stores/useAppStore';
import { useRealtimeInterventions } from '@/hooks/useRealtimeInterventions';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Enable real-time AI interventions listening
  useRealtimeInterventions();
  
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Desktop Sidebar - Fixed, stable, never auto-collapses */}
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

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-smooth md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main Content - Proper margin based on sidebar state */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-smooth flex flex-col',
          sidebarOpen ? 'md:ml-64' : 'md:ml-[72px]'
        )}
      >
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}