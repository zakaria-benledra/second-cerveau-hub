import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Sparkles,
  BookOpen,
  Target,
  Wallet,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useActiveProgram } from '@/hooks/useActiveProgram';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Navigation simplifiée - 8 items seulement
const navItems = [
  { icon: Home, label: 'Accueil', path: '/dashboard', description: 'Vue d\'ensemble' },
  { icon: CheckSquare, label: 'Tâches', path: '/tasks', description: 'Gérer mes tâches' },
  { icon: Sparkles, label: 'Habitudes', path: '/habits', description: 'Mes habitudes quotidiennes' },
  { icon: BookOpen, label: 'Journal', path: '/journal', description: 'Mon journal personnel' },
  { icon: Target, label: 'Programme', path: '/program', description: 'Mon parcours', showBadge: true },
  { icon: Wallet, label: 'Finances', path: '/finance', description: 'Gérer mon budget' },
  { icon: Trophy, label: 'Succès', path: '/achievements', description: 'Mes récompenses' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { data: program } = useActiveProgram();

  const NavItem = ({ icon: Icon, label, path, description, showBadge }: {
    icon: typeof Home;
    label: string;
    path: string;
    description?: string;
    showBadge?: boolean;
  }) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

    const content = (
      <Link
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'scale-110')} />
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1">
            <span className="truncate">{label}</span>
            {showBadge && program && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                J{program.current_day}
              </Badge>
            )}
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="rounded-lg shadow-lg">
            <p className="font-medium">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sidebar-background to-sidebar-background/95">
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-sidebar-border/50 px-4',
        collapsed && 'justify-center px-2'
      )}>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Minded</span>
          )}
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Paramètres + Toggle */}
      <div className="border-t border-sidebar-border/50 p-2 space-y-1">
        <NavItem icon={Settings} label="Paramètres" path="/settings" description="Réglages" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200',
            !collapsed && 'justify-start px-3'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Réduire</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
