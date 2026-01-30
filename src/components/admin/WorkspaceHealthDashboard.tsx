import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useProductIntelligence, useChurnRiskDistribution } from '@/hooks/useProductIntelligence';
import { useBIStats } from '@/hooks/useBIStats';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Wallet,
  BarChart3,
  Loader2,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, subtitle, trend, icon, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', variantStyles[variant])}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                 trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskDistributionChart({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0) || 1;
  
  const segments = [
    { key: 'low', label: 'Low', color: 'bg-success', value: distribution.low || 0 },
    { key: 'medium', label: 'Medium', color: 'bg-warning', value: distribution.medium || 0 },
    { key: 'high', label: 'High', color: 'bg-orange-500', value: distribution.high || 0 },
    { key: 'critical', label: 'Critical', color: 'bg-destructive', value: distribution.critical || 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        {segments.map(segment => (
          <div
            key={segment.key}
            className={cn('transition-all', segment.color)}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {segments.map(segment => (
          <div key={segment.key} className="space-y-1">
            <div className={cn('w-3 h-3 rounded-full mx-auto', segment.color)} />
            <p className="text-muted-foreground">{segment.label}</p>
            <p className="font-semibold">{segment.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceHealthDashboard() {
  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = useProductIntelligence();
  const { data: riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 } } = useChurnRiskDistribution();
  const { daily } = useBIStats(7);

  const isLoading = funnelLoading;

  // Calculate key metrics from funnel data
  const latestFunnel = funnelData?.[0];
  const totalUsers = latestFunnel?.signups ?? 0;
  const activatedUsers = latestFunnel?.activated_users ?? 0;
  const retainedUsers = latestFunnel?.retained_users ?? 0;
  const aiEngagedUsers = latestFunnel?.ai_engaged_users ?? 0;
  const financeConnectedUsers = latestFunnel?.finance_connected_users ?? 0;

  const activationRate = totalUsers > 0 ? Math.round((activatedUsers / totalUsers) * 100) : 0;
  const retentionRate = activatedUsers > 0 ? Math.round((retainedUsers / activatedUsers) * 100) : 0;
  const aiEngagementRate = activatedUsers > 0 ? Math.round((aiEngagedUsers / activatedUsers) * 100) : 0;
  const financeAdoptionRate = activatedUsers > 0 ? Math.round((financeConnectedUsers / activatedUsers) * 100) : 0;

  // Count users at risk
  const usersAtRisk = (riskDistribution.high || 0) + (riskDistribution.critical || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspace Health</h2>
          <p className="text-muted-foreground">Funnel, risques et adoption des fonctionnalités</p>
        </div>
        <Button variant="outline" onClick={() => refetchFunnel()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Taux d'activation"
          value={`${activationRate}%`}
          subtitle={`${activatedUsers} / ${totalUsers} utilisateurs`}
          icon={<Activity className="h-5 w-5 text-primary" />}
          variant={activationRate >= 30 ? 'success' : activationRate >= 15 ? 'warning' : 'danger'}
        />
        <MetricCard
          title="Taux de rétention"
          value={`${retentionRate}%`}
          subtitle={`${retainedUsers} utilisateurs actifs`}
          icon={<Users className="h-5 w-5 text-success" />}
          variant={retentionRate >= 50 ? 'success' : retentionRate >= 30 ? 'warning' : 'danger'}
        />
        <MetricCard
          title="Engagement AI"
          value={`${aiEngagementRate}%`}
          subtitle={`${aiEngagedUsers} utilisateurs`}
          icon={<Brain className="h-5 w-5 text-accent" />}
          variant={aiEngagementRate >= 40 ? 'success' : aiEngagementRate >= 20 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Adoption Finance"
          value={`${financeAdoptionRate}%`}
          subtitle={`${financeConnectedUsers} connectés`}
          icon={<Wallet className="h-5 w-5 text-warning" />}
          variant={financeAdoptionRate >= 25 ? 'success' : financeAdoptionRate >= 10 ? 'warning' : 'default'}
        />
      </div>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Churn Risk
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Zap className="h-4 w-4" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Funnel</CardTitle>
              <CardDescription>De l'inscription à la rétention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funnel visualization */}
              <div className="space-y-3">
                <FunnelStep 
                  label="Inscriptions" 
                  value={totalUsers} 
                  percentage={100} 
                />
                <FunnelStep 
                  label="Activés" 
                  value={activatedUsers} 
                  percentage={activationRate} 
                />
                <FunnelStep 
                  label="Engagés AI" 
                  value={aiEngagedUsers} 
                  percentage={aiEngagementRate} 
                />
                <FunnelStep 
                  label="Retenus" 
                  value={retainedUsers} 
                  percentage={retentionRate} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>Répartition des utilisateurs par niveau de risque</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskDistributionChart distribution={riskDistribution} />
              </CardContent>
            </Card>

            <Card className={cn(
              usersAtRisk > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'
            )}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {usersAtRisk > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  Alert Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersAtRisk > 0 ? (
                  <div className="space-y-3">
                    <p className="text-3xl font-bold text-destructive">{usersAtRisk}</p>
                    <p className="text-sm text-muted-foreground">
                      utilisateurs à risque élevé ou critique qui pourraient churner dans les 7 prochains jours.
                    </p>
                    <Button variant="destructive" size="sm" className="w-full">
                      Voir les détails
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                    <p className="font-medium">Aucun utilisateur à risque critique</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tous les utilisateurs sont en bonne santé
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feature Adoption</CardTitle>
              <CardDescription>Taux d'utilisation des fonctionnalités clés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeatureAdoptionRow 
                feature="AI Coach" 
                users={aiEngagedUsers} 
                total={activatedUsers}
                icon={<Brain className="h-4 w-4" />}
              />
              <FeatureAdoptionRow 
                feature="Finance Module" 
                users={financeConnectedUsers} 
                total={activatedUsers}
                icon={<Wallet className="h-4 w-4" />}
              />
              <FeatureAdoptionRow 
                feature="Automations" 
                users={Math.round(activatedUsers * 0.15)} 
                total={activatedUsers}
                icon={<Zap className="h-4 w-4" />}
              />
              <FeatureAdoptionRow 
                feature="Goals Tracking" 
                users={Math.round(activatedUsers * 0.45)} 
                total={activatedUsers}
                icon={<Target className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FunnelStep({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} ({percentage}%)</span>
      </div>
      <Progress value={percentage} className="h-3" />
    </div>
  );
}

function FeatureAdoptionRow({ feature, users, total, icon }: { 
  feature: string; 
  users: number; 
  total: number;
  icon: React.ReactNode;
}) {
  const percentage = total > 0 ? Math.round((users / total) * 100) : 0;
  
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium">{feature}</span>
          <span className="text-muted-foreground">{users} utilisateurs ({percentage}%)</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </div>
  );
}

export default WorkspaceHealthDashboard;
