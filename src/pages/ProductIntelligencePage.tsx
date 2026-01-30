import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFunnelMetrics, useChurnDistribution } from '@/hooks/useProductIntelligence';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Brain,
  Wallet,
  AlertTriangle,
  Target,
  Sparkles,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const COLORS = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 84% 60%)',
};

export default function ProductIntelligencePage() {
  const [dateRange, setDateRange] = useState(30);
  const { data: funnelData = [], isLoading: funnelLoading, refetch } = useFunnelMetrics(dateRange);
  const { data: churnDistribution = [] } = useChurnDistribution();

  // Calculate aggregated metrics
  const metrics = {
    totalSignups: funnelData.reduce((sum, d) => sum + (d.signups || 0), 0),
    totalActivated: funnelData.reduce((sum, d) => sum + (d.activated_users || 0), 0),
    avgActivationRate: funnelData.length > 0 
      ? Math.round(funnelData.reduce((sum, d) => sum + (d.activation_rate || 0), 0) / funnelData.length)
      : 0,
    avgRetentionRate: funnelData.length > 0 
      ? Math.round(funnelData.reduce((sum, d) => sum + (d.retention_rate || 0), 0) / funnelData.length)
      : 0,
    aiEngaged: funnelData.reduce((sum, d) => sum + (d.ai_engaged_users || 0), 0),
    financeConnected: funnelData.reduce((sum, d) => sum + (d.finance_connected_users || 0), 0),
    churned: funnelData.reduce((sum, d) => sum + (d.churned_users || 0), 0),
  };

  // Funnel visualization data
  const funnelVizData = [
    { name: 'Visites', value: funnelData.reduce((sum, d) => sum + (d.visits || 0), 0), fill: COLORS.primary },
    { name: 'Inscriptions', value: metrics.totalSignups, fill: COLORS.accent },
    { name: 'Activés', value: metrics.totalActivated, fill: COLORS.success },
    { name: 'AI Engagés', value: metrics.aiEngaged, fill: 'hsl(262 83% 58%)' },
    { name: 'Finance', value: metrics.financeConnected, fill: COLORS.warning },
  ];

  // Churn heatmap data
  const churnData = churnDistribution.map(d => ({
    level: d.risk_level,
    count: d.count,
    fill: d.risk_level === 'critical' ? COLORS.destructive :
          d.risk_level === 'high' ? 'hsl(24 100% 50%)' :
          d.risk_level === 'medium' ? COLORS.warning : COLORS.success,
  }));

  // Time series for activation/retention
  const trendData = funnelData.slice(-14).map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: fr }),
    activation: d.activation_rate || 0,
    retention: d.retention_rate || 0,
    churned: d.churned_users || 0,
  }));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Product Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Métriques produit et trajectoire utilisateur
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="glass-hover gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <AnimatedContainer animation="fade-up" delay={0}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/15">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalSignups}</p>
                    <p className="text-xs text-muted-foreground">Inscriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay={50}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-success/15">
                    <Sparkles className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.avgActivationRate}%</p>
                    <p className="text-xs text-muted-foreground">Activation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay={100}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent/15">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.avgRetentionRate}%</p>
                    <p className="text-xs text-muted-foreground">Rétention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay={150}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.aiEngaged}</p>
                    <p className="text-xs text-muted-foreground">AI Engagés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay={200}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-warning/15">
                    <Wallet className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.financeConnected}</p>
                    <p className="text-xs text-muted-foreground">Finance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay={250}>
            <Card className="glass-strong hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-destructive/15">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.churned}</p>
                    <p className="text-xs text-muted-foreground">Churned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Funnel Visualization */}
          <AnimatedContainer animation="fade-up" delay={300}>
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Funnel de Conversion
                </CardTitle>
                <CardDescription>De la visite à l'engagement complet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelVizData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelVizData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Churn Heatmap */}
          <AnimatedContainer animation="fade-up" delay={350}>
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Distribution du Risque Churn
                </CardTitle>
                <CardDescription>Répartition des utilisateurs par niveau de risque</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={churnData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="level"
                        label={({ level, count }) => `${level}: ${count}`}
                      >
                        {churnData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Activation/Retention Trend */}
          <AnimatedContainer animation="fade-up" delay={400} className="lg:col-span-2">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Tendance Activation & Rétention
                </CardTitle>
                <CardDescription>Évolution sur les 14 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="activation" 
                        name="Activation %"
                        stroke={COLORS.success} 
                        fill={COLORS.success} 
                        fillOpacity={0.2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="retention" 
                        name="Rétention %"
                        stroke={COLORS.primary} 
                        fill={COLORS.primary} 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* AI ROI Score */}
        <AnimatedContainer animation="fade-up" delay={450}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI ROI Score
              </CardTitle>
              <CardDescription>
                Impact de l'AI Coach sur l'engagement utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-purple-500/10">
                  <p className="text-3xl font-bold text-purple-500">
                    {metrics.aiEngaged > 0 && metrics.totalActivated > 0 
                      ? Math.round((metrics.aiEngaged / metrics.totalActivated) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Adoption AI</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-success/10">
                  <p className="text-3xl font-bold text-success">
                    +{Math.round(metrics.avgRetentionRate * 0.15)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Lift Rétention</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <p className="text-3xl font-bold text-primary">
                    {metrics.aiEngaged * 2.5}€
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Valeur Estimée</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
