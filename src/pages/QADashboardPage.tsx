import { useState } from 'react';
import { useQA } from '@/hooks/useQA';
import { useAICoach } from '@/hooks/useAICoach';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TestTube2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Circle,
  RefreshCw,
  Search,
  Loader2,
  Activity,
  FileText,
  Zap,
  Calculator,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusIcons = {
  not_tested: <Circle className="h-4 w-4 text-muted-foreground" />,
  partial: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  verified: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusColors = {
  not_tested: 'secondary',
  partial: 'warning',
  verified: 'success',
  failed: 'destructive',
} as const;

export default function QADashboardPage() {
  const {
    tests,
    testsLoading,
    events,
    eventsLoading,
    refetchEvents,
    auditLog,
    auditLogLoading,
    refetchAuditLog,
    stats,
    updateTestStatus,
    isUpdating,
    computeScore,
    isComputing,
  } = useQA();

  const { simulateEvent, isSimulating } = useAICoach();

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState('');

  // Filter tests
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.feature_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'all' || test.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  // Get unique modules
  const modules = [...new Set(tests.map(t => t.module))];

  // Filter events
  const filteredEvents = events.filter(event =>
    eventFilter === '' || 
    event.event_type.toLowerCase().includes(eventFilter.toLowerCase()) ||
    event.entity.toLowerCase().includes(eventFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TestTube2 className="h-8 w-8 text-primary" />
            QA Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Test interactif et vérification des fonctionnalités
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-500">{stats.verified}</div>
            <div className="text-sm text-muted-foreground">Vérifiés</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats.partial}</div>
            <div className="text-sm text-muted-foreground">Partiels</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Échoués</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-muted-foreground">{stats.notTested}</div>
            <div className="text-sm text-muted-foreground">Non testés</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tests">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="simulate">Simuler</TabsTrigger>
        </TabsList>

        {/* TESTS TAB */}
        <TabsContent value="tests" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une fonctionnalité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {modules.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Matrix Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Fonctionnalité</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Entrée UI</TableHead>
                      <TableHead>Résultat attendu</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun test trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTests.map(test => (
                        <TableRow key={test.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {statusIcons[test.status]}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{test.feature_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{test.module}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {test.ui_entry}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {test.expected_result}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-500"
                                onClick={() => updateTestStatus({ id: test.id, status: 'verified' })}
                                disabled={isUpdating}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-yellow-500"
                                onClick={() => updateTestStatus({ id: test.id, status: 'partial' })}
                                disabled={isUpdating}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500"
                                onClick={() => updateTestStatus({ id: test.id, status: 'failed' })}
                                disabled={isUpdating}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer par type ou entité..."
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => refetchEvents()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Événements système ({filteredEvents.length})
              </CardTitle>
              <CardDescription>Flux temps réel des événements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun événement
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{event.event_type}</Badge>
                            <Badge variant="secondary">{event.entity}</Badge>
                            <Badge variant={event.processed ? 'default' : 'secondary'}>
                              {event.source}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT LOG TAB */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => refetchAuditLog()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Journal d'audit ({auditLog.length})
              </CardTitle>
              <CardDescription>Toutes les mutations sont tracées</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {auditLogLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : auditLog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune entrée d'audit
                  </p>
                ) : (
                  <div className="space-y-2">
                    {auditLog.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <Badge
                          variant={
                            entry.action === 'create'
                              ? 'default'
                              : entry.action === 'update'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {entry.action}
                        </Badge>
                        <span className="font-medium">{entry.entity}</span>
                        <span className="text-xs text-muted-foreground flex-1">
                          {entry.entity_id?.slice(0, 8)}...
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), 'dd/MM HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SIMULATE TAB */}
        <TabsContent value="simulate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Simulation d'événements
              </CardTitle>
              <CardDescription>
                Déclenchez des événements pour tester le moteur d'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('habit.missed')}
                  disabled={isSimulating}
                >
                  <span className="text-2xl">🎯</span>
                  <span className="text-xs">Habitude manquée</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('budget.threshold_reached')}
                  disabled={isSimulating}
                >
                  <span className="text-2xl">💰</span>
                  <span className="text-xs">Budget dépassé</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('day.overloaded')}
                  disabled={isSimulating}
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-xs">Jour surchargé</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('burnout.risk_high')}
                  disabled={isSimulating}
                >
                  <span className="text-2xl">🔥</span>
                  <span className="text-xs">Risque Burnout</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Recalcul des scores
              </CardTitle>
              <CardDescription>
                Déclenche manuellement le calcul du score quotidien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => computeScore()} disabled={isComputing} className="w-full">
                {isComputing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Recalculer le score aujourd'hui
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
