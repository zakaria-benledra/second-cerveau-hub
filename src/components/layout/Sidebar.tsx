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
  Zap,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: Home, label: 'Today', path: '/' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Target, label: 'Habits', path: '/habits' },
  { icon: Inbox, label: 'Inbox', path: '/inbox' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: Zap, label: 'Focus', path: '/focus' },
  { icon: BookOpen, label: 'Learning', path: '/learning' },
  { icon: Wallet, label: 'Finance', path: '/finance' },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: Brain, label: 'AI Agent', path: '/agent' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    
    const content = (
      <Link
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all border-2',
          isActive
            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
            : 'border-transparent hover:bg-accent hover:border-border',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="border-2 shadow-xs">
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
        'flex h-16 items-center border-b-2 border-border px-4',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-foreground text-background font-bold">
            SC
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">SECOND CERVEAU</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t-2 border-border p-2 space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full justify-center border-2 border-transparent hover:border-border',
            !collapsed && 'justify-start px-3'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
