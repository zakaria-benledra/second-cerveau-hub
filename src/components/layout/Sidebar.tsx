import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ListChecks,
  Sparkles,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
  Wallet,
  MoreHorizontal,
  Heart,
  ListTodo,
  Timer,
  Brain,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Grouped navigation structure - Transformation Comportementale
const navGroups = [
  {
    label: 'Mon Quotidien',
    icon: Home,
    collapsible: false,
    items: [
      { icon: Home, label: 'Accueil', path: '/identity' },
      { icon: ListChecks, label: 'Tâches', path: '/tasks' },
      { icon: Sparkles, label: 'Habitudes', path: '/habits' },
    ],
  },
  {
    label: 'Ma Croissance',
    icon: TrendingUp,
    collapsible: false,
    items: [
      { icon: TrendingUp, label: 'Progression', path: '/scores' },
      { icon: Target, label: 'Objectifs', path: '/goals' },
      { icon: BookOpen, label: 'Journal', path: '/journal' },
      { icon: Trophy, label: 'Achievements', path: '/achievements' },
    ],
  },
  {
    label: 'Mon Organisation',
    icon: Calendar,
    collapsible: false,
    items: [
      { icon: Calendar, label: 'Calendrier', path: '/calendar' },
      { icon: Wallet, label: 'Finances', path: '/finance' },
    ],
  },
  {
    label: 'Plus',
    icon: MoreHorizontal,
    collapsible: true,
    items: [
      { icon: Heart, label: 'Behavior Hub', path: '/behavior-hub' },
      { icon: ListTodo, label: 'Kanban', path: '/kanban' },
      { icon: Timer, label: 'Focus', path: '/focus' },
      { icon: Brain, label: 'Coach IA', path: '/ai-coach' },
      { icon: BarChart3, label: 'Analyses', path: '/bi/executive' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: Settings, label: 'Paramètres', path: '/settings' },
    ],
  },
];

const bottomItems: { icon: typeof Home; label: string; path: string }[] = [];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Insights: true,
    Système: false,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Check if any item in a group is active
  const isGroupActive = (items: { path: string }[]) => {
    return items.some(item => location.pathname === item.path);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: typeof Home; label: string; path: string }) => {
    const isActive = location.pathname === path || 
      (path.includes('?') && location.pathname + location.search === path);
    
    const content = (
      <Link
        to={path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          collapsed && 'justify-center px-2 border-l-0'
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

  const GroupLabel = ({ 
    icon: Icon, 
    label, 
    collapsible, 
    isOpen, 
    onToggle: onGroupToggle,
    badge,
    hasActiveItem,
  }: { 
    icon: typeof Home; 
    label: string; 
    collapsible?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    badge?: string;
    hasActiveItem?: boolean;
  }) => {
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-2 px-2">
              <div className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center",
                hasActiveItem ? "bg-sidebar-primary/20" : "bg-sidebar-accent/50"
              )}>
                <Icon className={cn(
                  "h-3.5 w-3.5",
                  hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                )} />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-lg shadow-lg font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (collapsible) {
      return (
        <button
          onClick={onGroupToggle}
          className="flex items-center gap-2 px-3 py-2 mt-4 first:mt-0 w-full hover:bg-sidebar-accent/30 rounded-lg transition-colors"
        >
          <Icon className={cn(
            "h-3.5 w-3.5",
            hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40"
          )} />
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wider flex-1 text-left",
            hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40"
          )}>
            {label}
          </span>
          {badge && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {badge}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      );
    }
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 mt-4 first:mt-0">
        <Icon className={cn(
          "h-3.5 w-3.5",
          hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40"
        )} />
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          hasActiveItem ? "text-sidebar-primary" : "text-sidebar-foreground/40"
        )}>
          {label}
        </span>
        {badge && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            {badge}
          </Badge>
        )}
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
        {navGroups.map((group, groupIndex) => {
          const hasActiveItem = isGroupActive(group.items);
          const isOpen = openGroups[group.label] ?? true;

          if (group.collapsible && !collapsed) {
            return (
              <Collapsible
                key={group.label}
                open={isOpen || hasActiveItem}
                onOpenChange={() => toggleGroup(group.label)}
                className={cn(groupIndex > 0 && 'mt-2')}
              >
                <CollapsibleTrigger asChild>
                  <div>
                    <GroupLabel 
                      icon={group.icon} 
                      label={group.label} 
                      collapsible 
                      isOpen={isOpen || hasActiveItem}
                      onToggle={() => toggleGroup(group.label)}
                      hasActiveItem={hasActiveItem}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem key={item.path} {...item} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <div key={group.label} className={cn(groupIndex > 0 && !collapsed && 'mt-2')}>
              {group.label === 'Mon Quotidien' && !collapsed ? (
                <div className="mb-2 px-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
              ) : (
                <GroupLabel 
                  icon={group.icon} 
                  label={group.label} 
                  hasActiveItem={hasActiveItem}
                />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.path} {...item} />
                ))}
              </div>
            </div>
          );
        })}
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
