import { Menu, Bell, Search, Sun, Moon, ChevronRight, Home, ArrowLeft, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useAINotifications } from '@/hooks/useAIBehavior';
import { useAuth, signOut } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
}

// Breadcrumb mapping
const routeLabels: Record<string, string> = {
  '/': 'Accueil',
  '/dashboard': 'Tableau de bord',
  '/tasks': 'Tâches',
  '/habits': 'Habitudes',
  '/journal': 'Journal',
  '/program': 'Programme',
  '/finance': 'Finances',
  '/achievements': 'Succès',
  '/settings': 'Paramètres',
  '/coach': 'Coach IA',
  '/intelligence': 'Intelligence',
  '/auth': 'Connexion',
  '/notifications': 'Notifications',
};

export function Header({ onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Unified notification count: legacy + AI notifications
  const { data: legacyUnread = 0 } = useUnreadCount();
  const { unreadCount: aiUnread = 0 } = useAINotifications();
  const totalUnread = legacyUnread + aiUnread;
  
  // Show back button only if not on home page
  const showBackButton = location.pathname !== '/';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  useEffect(() => {
    // Check localStorage or default to dark
    const stored = localStorage.getItem('theme');
    const prefersDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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

        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

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

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Unified Notifications Bell - Links to Notifications page */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-lg">
            <Bell className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center font-semibold text-sm text-primary-foreground">
                {getUserInitials()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Mon compte</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'Utilisateur'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
