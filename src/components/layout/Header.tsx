import { Menu, Bell, Search, Sun, Moon, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

// Breadcrumb mapping
const routeLabels: Record<string, string> = {
  '/': 'Aujourd\'hui',
  '/today': 'Aujourd\'hui',
  '/tasks': 'Tâches',
  '/kanban': 'Kanban',
  '/habits': 'Habitudes',
  '/routines': 'Routines',
  '/inbox': 'Inbox',
  '/dashboard': 'Tableau de bord',
  '/projects': 'Projets',
  '/goals': 'Objectifs',
  '/focus': 'Focus',
  '/calendar': 'Calendrier',
  '/learning': 'Apprentissage',
  '/journal': 'Journal',
  '/finance': 'Finances',
  '/scores': 'Scores',
  '/intelligence': 'Intelligence Hub',
  '/history': 'Historique',
  '/automation': 'Automatisation',
  '/agent': 'Agent',
  '/ai-coach': 'AI Coach',
  '/settings': 'Paramètres',
  '/notifications': 'Notifications',
};

export function Header({ onMenuClick }: HeaderProps) {
  const { inboxItems } = useAppStore();
  const unreadCount = inboxItems.filter((i) => i.status === 'new').length;
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const currentLabel = routeLabels[location.pathname] || 'Page';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-lg px-4 md:px-6">
      {/* Left Section - Menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm">
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground">{currentLabel}</span>
        </nav>

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="w-56 pl-10 bg-muted/50 border-transparent focus:bg-background focus:border-border"
            />
          </div>
        </div>
      </div>

      {/* Right Section - No global Add button (removed per UX rules) */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-lg">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <Button variant="ghost" size="icon" className="rounded-lg">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">
            U
          </div>
        </Button>
      </div>
    </header>
  );
}
