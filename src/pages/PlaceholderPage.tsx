import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FolderKanban,
  Calendar,
  Zap,
  BookOpen,
  Wallet,
  BarChart3,
  Brain,
  Settings,
  ArrowRight,
  Construction,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const comingSoonPages = [
  {
    icon: FolderKanban,
    title: 'Projects',
    description: 'Organize work into domains and projects',
    path: '/projects',
  },
  {
    icon: Calendar,
    title: 'Calendar',
    description: 'Time blocking and event management',
    path: '/calendar',
  },
  {
    icon: Zap,
    title: 'Focus',
    description: 'Pomodoro timer and deep work sessions',
    path: '/focus',
  },
  {
    icon: BookOpen,
    title: 'Learning',
    description: 'Reading list, highlights, and flashcards',
    path: '/learning',
  },
  {
    icon: Wallet,
    title: 'Finance',
    description: 'Budget tracking and expense management',
    path: '/finance',
  },
  {
    icon: BarChart3,
    title: 'Dashboard',
    description: 'Analytics and performance metrics',
    path: '/dashboard',
  },
  {
    icon: Brain,
    title: 'AI Agent',
    description: 'AI-powered insights and automation',
    path: '/agent',
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Preferences and account management',
    path: '/settings',
  },
];

export default function PlaceholderPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
            <Construction className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Coming Soon</h1>
            <p className="text-muted-foreground">
              This feature is under construction
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect to <strong>Lovable Cloud</strong> to enable backend features including
              database persistence, authentication, AI agent, and real-time sync.
            </p>
            <Button className="mt-6 border-2 shadow-xs">
              Enable Cloud Backend
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="font-bold mb-4">Available Modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoonPages.map((page) => (
              <Link key={page.path} to={page.path}>
                <Card className="border-2 hover:shadow-xs transition-all h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 border-2 border-foreground flex items-center justify-center mb-3">
                        <page.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold">{page.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {page.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
