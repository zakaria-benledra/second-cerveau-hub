import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, Eye, MousePointer, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DailyData {
  date: string;
  views: number;
  actions: number;
  conversions: number;
}

interface TopEvent {
  name: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState(7);

  // Événements par jour
  const { data: dailyEvents } = useQuery({
    queryKey: ['analytics-daily', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('analytics_events')
        .select('created_at, event_category')
        .gte('created_at', startDate)
        .order('created_at');
      
      // Agréger par jour
      const byDay: Record<string, DailyData> = {};
      data?.forEach(event => {
        const day = format(new Date(event.created_at!), 'yyyy-MM-dd');
        if (!byDay[day]) {
          byDay[day] = { date: day, views: 0, actions: 0, conversions: 0 };
        }
        if (event.event_category === 'page_view') byDay[day].views++;
        if (event.event_category === 'action') byDay[day].actions++;
        if (event.event_category === 'conversion') byDay[day].conversions++;
      });
      
      return Object.values(byDay);
    },
  });

  // Top événements
  const { data: topEvents } = useQuery({
    queryKey: ['analytics-top-events', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('analytics_events')
        .select('event_name')
        .gte('created_at', startDate);
      
      const counts: Record<string, number> = {};
      data?.forEach(e => {
        counts[e.event_name] = (counts[e.event_name] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) as TopEvent[];
    },
  });

  // Métriques clés
  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data: events } = await supabase
        .from('analytics_events')
        .select('user_id, session_id, event_category')
        .gte('created_at', startDate);
      
      const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size;
      const uniqueSessions = new Set(events?.map(e => e.session_id)).size;
      const pageViews = events?.filter(e => e.event_category === 'page_view').length || 0;
      const conversions = events?.filter(e => e.event_category === 'conversion').length || 0;
      
      return { uniqueUsers, uniqueSessions, pageViews, conversions };
    },
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📊 Analytics Dashboard</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border bg-background"
          >
            <option value={7}>7 derniers jours</option>
            <option value={14}>14 derniers jours</option>
            <option value={30}>30 derniers jours</option>
          </select>
        </div>

        {/* Métriques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics?.uniqueUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Utilisateurs uniques</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics?.pageViews || 0}</p>
                  <p className="text-sm text-muted-foreground">Pages vues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MousePointer className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics?.uniqueSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{metrics?.conversions || 0}</p>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité par jour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyEvents || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd/MM')} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke={COLORS[0]} name="Vues" />
                  <Line type="monotone" dataKey="actions" stroke={COLORS[1]} name="Actions" />
                  <Line type="monotone" dataKey="conversions" stroke={COLORS[2]} name="Conversions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEvents || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
