import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnimatedContainer, StaggeredList } from '@/components/ui/animated-container';
import { useAIInterventionsHistory } from '@/hooks/useAIInterventions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  XCircle,
  Filter,
  BarChart3,
  Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

type InterventionType = 'all' | 'reduce_load' | 'force_break' | 'streak_protection' | 'financial_alert' | 'motivation' | 'warning' | 'challenge';
type SeverityFilter = 'all' | 'advisory' | 'warning' | 'critical';
type PeriodFilter = '7' | '30' | '90';

const INTERVENTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reduce_load: { label: 'Réduction charge', icon: <TrendingDown className="h-4 w-4" />, color: 'text-warning' },
  force_break: { label: 'Pause forcée', icon: <Clock className="h-4 w-4" />, color: 'text-destructive' },
  streak_protection: { label: 'Protection streak', icon: <Shield className="h-4 w-4" />, color: 'text-primary' },
  financial_alert: { label: 'Alerte budget', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-warning' },
  motivation: { label: 'Motivation', icon: <TrendingUp className="h-4 w-4" />, color: 'text-success' },
  warning: { label: 'Avertissement', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-warning' },
  challenge: { label: 'Défi', icon: <Activity className="h-4 w-4" />, color: 'text-primary' },
  praise: { label: 'Encouragement', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-success' },
  restructure: { label: 'Restructuration', icon: <BarChart3 className="h-4 w-4" />, color: 'text-info' },
};

const SEVERITY_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  advisory: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  warning: { variant: 'outline', className: 'border-warning text-warning' },
  critical: { variant: 'destructive', className: '' },
};

export default function AIInterventionsPage() {
  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [typeFilter, setTypeFilter] = useState<InterventionType>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [activeTab, setActiveTab] = useState('timeline');

  const { data: interventions, isLoading } = useAIInterventionsHistory(Number(period));

  // Filter interventions
  const filteredInterventions = useMemo(() => {
    if (!interventions) return [];
    
    return interventions.filter(intervention => {
      if (typeFilter !== 'all' && intervention.intervention_type !== typeFilter) return false;
      if (severityFilter !== 'all' && intervention.severity !== severityFilter) return false;
      return true;
    });
  }, [interventions, typeFilter, severityFilter]);

  // Compute statistics
  const stats = useMemo(() => {
    if (!interventions || interventions.length === 0) {
      return {
        total: 0,
        accepted: 0,
        rejected: 0,
        autoApplied: 0,
        criticalCount: 0,
        warningCount: 0,
        advisoryCount: 0,
        acceptanceRate: 0,
      };
    }

    const accepted = interventions.filter(i => i.user_action === 'accepted').length;
    const rejected = interventions.filter(i => i.user_action === 'rejected').length;
    const autoApplied = interventions.filter(i => i.auto_applied).length;
    const criticalCount = interventions.filter(i => i.severity === 'critical').length;
    const warningCount = interventions.filter(i => i.severity === 'warning').length;
    const advisoryCount = interventions.filter(i => i.severity === 'advisory').length;
    const responded = accepted + rejected;

    return {
      total: interventions.length,
      accepted,
      rejected,
      autoApplied,
      criticalCount,
      warningCount,
      advisoryCount,
      acceptanceRate: responded > 0 ? Math.round((accepted / responded) * 100) : 0,
    };
  }, [interventions]);

  // Group by type for breakdown
  const typeBreakdown = useMemo(() => {
    if (!interventions) return [];
    
    const counts: Record<string, number> = {};
    interventions.forEach(i => {
      counts[i.intervention_type] = (counts[i.intervention_type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [interventions]);

  const getInterventionMeta = (type: string) => {
    return INTERVENTION_LABELS[type] || { 
      label: type, 
      icon: <Brain className="h-4 w-4" />, 
      color: 'text-muted-foreground' 
    };
  };

  const getSeverityBadge = (severity: string) => {
    const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.advisory;
    return (
      <Badge variant={style.variant} className={style.className}>
        {severity}
      </Badge>
    );
  };

  const formatImpact = (impact: Record<string, unknown> | null) => {
    if (!impact) return null;
    
    const entries = Object.entries(impact).slice(0, 3);
    return entries.map(([key, value]) => (
      <span key={key} className="text-xs text-muted-foreground">
        {key.replace(/_/g, ' ')}: <span className="font-medium text-foreground">{String(value)}</span>
      </span>
    ));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedContainer delay={0} animation="fade-up">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Interventions IA</h1>
                <p className="text-muted-foreground text-sm">
                  Historique et impact des interventions comportementales automatiques
                </p>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Global Stats */}
        <AnimatedContainer delay={50} animation="fade-up">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total ({period}j)</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-appliquées</p>
                    <p className="text-2xl font-bold">{stats.autoApplied}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'acceptation</p>
                    <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertes critiques</p>
                    <p className="text-2xl font-bold">{stats.criticalCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedContainer>

        {/* Filters */}
        <AnimatedContainer delay={100} animation="fade-up">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtres:</span>
                </div>
                
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InterventionType)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="reduce_load">Réduction charge</SelectItem>
                    <SelectItem value="force_break">Pause forcée</SelectItem>
                    <SelectItem value="streak_protection">Protection streak</SelectItem>
                    <SelectItem value="financial_alert">Alerte budget</SelectItem>
                    <SelectItem value="motivation">Motivation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                {(typeFilter !== 'all' || severityFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setTypeFilter('all');
                      setSeverityFilter('all');
                    }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Main Content */}
        <AnimatedContainer delay={150} animation="fade-up">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="breakdown">Répartition</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              {isLoading ? (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="h-4 w-32 rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ) : filteredInterventions.length === 0 ? (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertTitle>Aucune intervention</AlertTitle>
                  <AlertDescription>
                    Aucune intervention IA n'a été enregistrée pour la période et les filtres sélectionnés.
                  </AlertDescription>
                </Alert>
              ) : (
                <Card className="glass">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[160px]">Type</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead className="w-[100px]">Sévérité</TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <StaggeredList baseDelay={0} staggerDelay={30}>
                        {filteredInterventions.map((intervention) => {
                          const meta = getInterventionMeta(intervention.intervention_type);
                          const context = intervention.context as Record<string, unknown> | null;
                          const impact = context?.impact as Record<string, unknown> | null;
                          
                          return (
                            <TableRow key={intervention.id}>
                              <TableCell className="text-sm">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {format(new Date(intervention.created_at), 'dd MMM', { locale: fr })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(intervention.created_at), 'HH:mm')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`flex items-center gap-2 ${meta.color}`}>
                                  {meta.icon}
                                  <span className="text-sm font-medium">{meta.label}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm line-clamp-2">
                                    {intervention.reason || intervention.ai_message}
                                  </p>
                                  {impact && (
                                    <div className="flex flex-wrap gap-2">
                                      {formatImpact(impact)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getSeverityBadge(intervention.severity || 'advisory')}
                              </TableCell>
                              <TableCell>
                                {intervention.auto_applied ? (
                                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Auto
                                  </Badge>
                                ) : intervention.user_action === 'accepted' ? (
                                  <Badge variant="secondary" className="bg-success/10 text-success">
                                    Accepté
                                  </Badge>
                                ) : intervention.user_action === 'rejected' ? (
                                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                                    Rejeté
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">En attente</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </StaggeredList>
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="breakdown">
              <div className="grid gap-4 md:grid-cols-2">
                {/* By Type */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Par type d'intervention</CardTitle>
                    <CardDescription>Répartition des interventions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typeBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune donnée disponible
                      </p>
                    ) : (
                      typeBreakdown.map(({ type, count }) => {
                        const meta = getInterventionMeta(type);
                        const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-2 ${meta.color}`}>
                                {meta.icon}
                                <span className="text-sm font-medium">{meta.label}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* By Severity */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Par niveau de sévérité</CardTitle>
                    <CardDescription>Distribution des alertes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                        <span className="text-sm">Advisory</span>
                      </div>
                      <span className="font-bold">{stats.advisoryCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-warning" />
                        <span className="text-sm">Warning</span>
                      </div>
                      <span className="font-bold">{stats.warningCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-destructive" />
                        <span className="text-sm">Critical</span>
                      </div>
                      <span className="font-bold">{stats.criticalCount}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Stats */}
                <Card className="glass md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Réponse aux interventions</CardTitle>
                    <CardDescription>Comment les interventions ont été traitées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-success/10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span className="text-2xl font-bold">{stats.accepted}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Acceptées</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-destructive/10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="text-2xl font-bold">{stats.rejected}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Rejetées</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-primary/10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <span className="text-2xl font-bold">{stats.autoApplied}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Auto-appliquées</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
