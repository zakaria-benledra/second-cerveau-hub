import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFunnelMetrics, useWorkspaceChurnRisks, useFunnelSummary } from '@/hooks/useProductIntelligence';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, TrendingUp, AlertTriangle, Brain, Wallet, 
  Activity, Zap, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { AnimatedContainer } from '@/components/ui/animated-container';

const RISK_COLORS = {
  low: 'hsl(142 76% 36%)',
  medium: 'hsl(45 93% 47%)',
  high: 'hsl(25 95% 53%)',
  critical: 'hsl(0 84% 60%)',
};

export function BusinessDashboard() {
  const { data: funnelData } = useFunnelMetrics(30);
  const { data: churnRisks } = useWorkspaceChurnRisks();
  const funnelSummary = useFunnelSummary(7);

  const funnelChartData = funnelData?.map((f) => ({
    date: new Date(f.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    visits: f.visits || 0,
    signups: f.signups || 0,
    activated: f.activated_users || 0,
    retained: f.retained_users || 0,
  })) || [];

  // Risk distribution
  const riskDistribution = {
    low: churnRisks?.filter((r) => r.risk_level === 'low').length || 0,
    medium: churnRisks?.filter((r) => r.risk_level === 'medium').length || 0,
    high: churnRisks?.filter((r) => r.risk_level === 'high').length || 0,
    critical: churnRisks?.filter((r) => r.risk_level === 'critical').length || 0,
  };

  const riskPieData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: RISK_COLORS[level as keyof typeof RISK_COLORS],
  }));

  // Feature adoption
  const featureAdoption = [
    { name: 'Habitudes', value: 85 },
    { name: 'Tâches', value: 92 },
    { name: 'Finance', value: funnelSummary.financeAdoptionRate },
    { name: 'AI Coach', value: funnelSummary.aiEngagementRate },
    { name: 'Focus', value: 45 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <AnimatedContainer delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-2 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visites (7j)</p>
                  <p className="text-2xl font-bold">{funnelSummary.totalVisits}</p>
                </div>
                <Users className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inscriptions</p>
                  <p className="text-2xl font-bold">{funnelSummary.totalSignups}</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Activation</p>
                  <p className="text-2xl font-bold">{funnelSummary.avgActivationRate.toFixed(1)}%</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rétention (7j)</p>
                  <p className="text-2xl font-bold">{funnelSummary.avgRetentionRate.toFixed(1)}%</p>
                </div>
                <Activity className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risque Critique</p>
                  <p className="text-2xl font-bold text-red-500">{riskDistribution.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="ai">AI ROI</TabsTrigger>
        </TabsList>

        {/* Funnel */}
        <TabsContent value="funnel">
          <AnimatedContainer delay={0}>
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Funnel de Conversion (30j)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={funnelChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))' 
                        }} 
                      />
                      <Line type="monotone" dataKey="visits" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Visites" />
                      <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Inscriptions" />
                      <Line type="monotone" dataKey="activated" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} name="Activés" />
                      <Line type="monotone" dataKey="retained" stroke="hsl(220 70% 50%)" strokeWidth={2} dot={false} name="Retenus" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* Churn Risk Map */}
        <TabsContent value="churn">
          <AnimatedContainer delay={0} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Distribution des Risques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {riskPieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm capitalize">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Utilisateurs à Risque Critique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {churnRisks?.filter((r) => r.risk_level === 'critical' || r.risk_level === 'high').slice(0, 10).map((risk) => (
                    <div key={risk.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{(risk as any).profiles?.email || 'Utilisateur'}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {Math.round(Number(risk.risk_score))} | {risk.risk_level}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        risk.risk_level === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {risk.risk_level}
                      </div>
                    </div>
                  ))}
                  {(!churnRisks || churnRisks.filter((r) => r.risk_level === 'critical' || r.risk_level === 'high').length === 0) && (
                    <p className="text-muted-foreground text-center py-4">Aucun utilisateur à haut risque</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* Feature Adoption */}
        <TabsContent value="adoption">
          <AnimatedContainer delay={0}>
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Adoption des Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureAdoption} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} className="text-xs" />
                      <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                      <Tooltip 
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* AI ROI */}
        <TabsContent value="ai">
          <AnimatedContainer delay={0}>
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ROI Intelligence Artificielle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Taux d'Engagement IA</p>
                    <p className="text-4xl font-bold mt-2">{funnelSummary.aiEngagementRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Actions Acceptées</p>
                    <p className="text-4xl font-bold mt-2 text-green-500">--</p>
                  </div>
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Gain de Productivité</p>
                    <p className="text-4xl font-bold mt-2 text-primary">+40%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
