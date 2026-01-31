import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Target,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Timer,
  TrendingUp,
  Bell,
  ListChecks,
  Heart,
  Zap,
  TestTube2,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Grouped navigation structure - Transformation Comportementale
const navGroups = [
  {
    label: 'Ma Trajectoire',
    icon: Target,
    items: [
      { icon: Home, label: 'Qui Je Deviens', path: '/' },
      { icon: TrendingUp, label: 'Mon Momentum', path: '/scores' },
      { icon: Brain, label: 'Intelligence IA', path: '/intelligence' },
    ],
  },
  {
    label: 'Engagement',
    icon: Zap,
    items: [
      { icon: Heart, label: 'Behavior Hub', path: '/behavior-hub' },
      { icon: ListChecks, label: 'Kanban', path: '/kanban' },
      { icon: Calendar, label: 'Calendrier', path: '/calendar' },
    ],
  },
  {
    label: 'Stabilité',
    icon: Shield,
    items: [
      { icon: Wallet, label: 'Finances', path: '/finance' },
      { icon: Heart, label: 'Bien-être', path: '/journal' },
      { icon: Timer, label: 'Focus', path: '/focus' },
    ],
  },
  {
    label: 'Système',
    icon: Settings,
    items: [
      { icon: Zap, label: 'Automations', path: '/automation' },
      { icon: Activity, label: 'Interventions IA', path: '/observability' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Settings, label: 'Paramètres', path: '/settings' },
    ],
  },
];

const bottomItems = [
  { icon: TestTube2, label: 'QA Dashboard', path: '/qa' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: { icon: typeof Home; label: string; path: string }) => {
    const isActive = location.pathname === path || 
      (path.includes('?') && location.pathname + location.search === path);
    
    const content = (
      <Link
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm border border-sidebar-primary/20'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform',
          isActive && 'scale-110'
        )} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="rounded-lg shadow-lg font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const GroupLabel = ({ icon: Icon, label }: { icon: typeof Home; label: string }) => {
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-2 px-2">
              <div className="h-6 w-6 rounded-md bg-sidebar-accent/50 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-sidebar-foreground/50" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-lg shadow-lg font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 mt-4 first:mt-0">
        <Icon className="h-3.5 w-3.5 text-sidebar-foreground/40" />
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          {label}
        </span>
      </div>
    );
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
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Minded</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && !collapsed && 'mt-2')}>
            <GroupLabel icon={group.icon} label={group.label} />
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border/50 p-2 space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        
        <Separator className="my-2 bg-sidebar-border/30" />
        
        {/* Collapse Toggle */}
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
