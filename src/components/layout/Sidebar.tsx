import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Target,
  Inbox,
  FolderKanban,
  Calendar,
  BookOpen,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Timer,
  TrendingUp,
  PenLine,
  Bell,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: Home, label: 'Aujourd\'hui', path: '/', color: 'text-primary' },
  { icon: CheckSquare, label: 'Tâches', path: '/tasks', color: 'text-primary' },
  { icon: Target, label: 'Habitudes', path: '/habits', color: 'text-primary' },
  { icon: ListChecks, label: 'Routines', path: '/routines', color: 'text-primary' },
  { icon: Inbox, label: 'Inbox', path: '/inbox', color: 'text-primary' },
  { icon: FolderKanban, label: 'Projets', path: '/projects', color: 'text-primary' },
  { icon: Timer, label: 'Focus', path: '/focus', color: 'text-primary' },
  { icon: TrendingUp, label: 'Objectifs', path: '/goals', color: 'text-primary' },
  { icon: Calendar, label: 'Calendrier', path: '/calendar', color: 'text-primary' },
  { icon: BookOpen, label: 'Apprentissage', path: '/learning', color: 'text-primary' },
  { icon: PenLine, label: 'Journal', path: '/journal', color: 'text-primary' },
  { icon: Wallet, label: 'Finances', path: '/finance', color: 'text-primary' },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard', color: 'text-primary' },
  { icon: Brain, label: 'Agent IA', path: '/agent', color: 'text-primary' },
  { icon: Bell, label: 'Notifications', path: '/notifications', color: 'text-primary' },
];

const bottomItems = [
  { icon: Settings, label: 'Paramètres', path: '/settings', color: 'text-muted-foreground' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path, color }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    
    const content = (
      <Link
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : color)} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="rounded-lg shadow-lg">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-sidebar-border px-4',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-md">
            SC
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-sidebar-foreground tracking-tight">SECOND</span>
              <span className="text-xs text-sidebar-foreground/60 -mt-0.5">CERVEAU</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            !collapsed && 'justify-start px-3'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Réduire</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
