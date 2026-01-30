import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFunnelSummary, useMyChurnRisk } from '@/hooks/useProductIntelligence';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useWeeklyStats } from '@/hooks/useBIStats';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Target, TrendingUp, AlertTriangle, Brain, Wallet, 
  Activity, Shield, Zap, Users 
} from 'lucide-react';
import { AnimatedContainer } from '@/components/ui/animated-container';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function StrategicControlRoom() {
  const { data: todayScore } = useTodayScore();
  const { data: scoreHistory } = useScoreHistory(30);
  const { data: weeklyStats } = useWeeklyStats(4);
  const churnRisk = useMyChurnRisk();
  const funnelSummary = useFunnelSummary(7);

  const trajectoryData = scoreHistory?.map((s) => ({
    date: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    score: Number(s.global_score) || 0,
    habits: Number(s.habits_score) || 0,
    tasks: Number(s.tasks_score) || 0,
    health: Number(s.health_score) || 0,
  })) || [];

  const riskLevel = churnRisk.data?.risk_level || 'low';
  const riskColor = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  }[riskLevel];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trajectory" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="trajectory" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Trajectoire
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Comportement
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="ai-strategy" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA Strategy
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risques
          </TabsTrigger>
        </TabsList>

        {/* Identity Trajectory */}
        <TabsContent value="trajectory">
          <AnimatedContainer delay={0} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Score Trend */}
            <Card className="lg:col-span-2 border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Évolution du Score Global (30j)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trajectoryData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))' 
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sub-scores */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Sous-Scores Actuels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Habitudes', value: todayScore?.habits_score, icon: Activity },
                  { label: 'Tâches', value: todayScore?.tasks_score, icon: Target },
                  { label: 'Santé', value: todayScore?.health_score, icon: Zap },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Number(item.value) || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-10 text-right">
                        {Math.round(Number(item.value) || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* Behavioral Drift Map */}
        <TabsContent value="behavior">
          <AnimatedContainer delay={0} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Tendances Comportementales (14j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))' 
                        }} 
                      />
                      <Line type="monotone" dataKey="habits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="tasks" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="health" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Métriques Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Taux d'activation</span>
                    <span className="font-mono font-bold">{funnelSummary.avgActivationRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Rétention (7j)</span>
                    <span className="font-mono font-bold">{funnelSummary.avgRetentionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Engagement IA</span>
                    <span className="font-mono font-bold">{funnelSummary.aiEngagementRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Adoption Finance</span>
                    <span className="font-mono font-bold">{funnelSummary.financeAdoptionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* Financial Momentum */}
        <TabsContent value="finance">
          <AnimatedContainer delay={0}>
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Momentum Financier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  📊 Visualisations financières disponibles dans l'onglet Finance
                </p>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* AI Strategy Queue */}
        <TabsContent value="ai-strategy">
          <AnimatedContainer delay={0}>
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  File d'Attente Stratégique IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  🤖 Propositions IA et actions stratégiques en attente d'approbation
                </p>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        {/* Risk & Opportunity Radar */}
        <TabsContent value="risks">
          <AnimatedContainer delay={0} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Votre Risque de Décrochage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className={`text-6xl font-bold font-mono ${riskColor}`}>
                    {Math.round(Number(churnRisk.data?.risk_score) || 0)}
                  </div>
                  <p className={`text-lg font-semibold mt-2 ${riskColor}`}>
                    Niveau: {riskLevel.toUpperCase()}
                  </p>
                </div>

                {churnRisk.data?.signals && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Signaux détectés:</p>
                    {Object.entries(churnRisk.data.signals as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <span className={typeof value === 'boolean' ? (value ? 'text-red-500' : 'text-green-500') : ''}>
                          {typeof value === 'boolean' ? (value ? '⚠️' : '✓') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Opportunités de Croissance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskLevel === 'low' && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm font-medium text-green-600">🚀 Excellent momentum</p>
                      <p className="text-xs text-muted-foreground">
                        Continuez sur cette lancée, explorez les fonctionnalités avancées
                      </p>
                    </div>
                  )}
                  {funnelSummary.aiEngagementRate < 30 && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium">💡 Potentiel IA inexploité</p>
                      <p className="text-xs text-muted-foreground">
                        L'AI Coach peut booster votre productivité de 40%
                      </p>
                    </div>
                  )}
                  {funnelSummary.financeAdoptionRate < 20 && (
                    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="text-sm font-medium">💰 Module Finance disponible</p>
                      <p className="text-xs text-muted-foreground">
                        Importez vos relevés pour un suivi complet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
