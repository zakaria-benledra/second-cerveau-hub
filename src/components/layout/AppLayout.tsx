import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r-2 border-border bg-sidebar transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          'hidden md:block'
        )}
      >
        <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r-2 border-border bg-sidebar transition-transform duration-300 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        )}
      >
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
