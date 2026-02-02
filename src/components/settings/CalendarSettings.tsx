import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Unlink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useGoogleConnectionStatus, useConnectGoogle, useDisconnectGoogle, useSyncGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CalendarSettings() {
  const { data: connectionStatus, isLoading } = useGoogleConnectionStatus();
  const connectGoogle = useConnectGoogle();
  const disconnectGoogle = useDisconnectGoogle();
  const syncCalendar = useSyncGoogleCalendar();
  const { toast } = useToast();

  const isConnected = connectionStatus?.connected ?? false;
  const isConfigured = connectionStatus?.configured ?? true;

  const handleConnect = () => {
    connectGoogle.mutate();
  };

  const handleSync = async () => {
    try {
      await syncCalendar.mutateAsync();
    } catch (error) {
      // Toast is handled in the hook
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogle.mutateAsync();
    } catch (error) {
      // Toast is handled in the hook
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendrier
        </CardTitle>
        <CardDescription>
          Synchronise tes tâches et habitudes avec ton calendrier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar */}
        <div className={`flex items-center justify-between p-4 rounded-lg border border-border/50 ${!isConfigured ? 'bg-card/30 opacity-70' : 'bg-card/50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="7" y="14" width="3" height="3" rx="0.5" fill="#4285F4" />
                <rect x="14" y="14" width="3" height="3" rx="0.5" fill="#EA4335" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Google Calendar</p>
              {isConnected && connectionStatus?.account?.email && (
                <p className="text-xs text-muted-foreground">
                  {connectionStatus.account.email}
                </p>
              )}
              {!isConfigured && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nécessite une configuration admin
                </p>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <Badge variant="outline">Chargement...</Badge>
          ) : !isConfigured ? (
            <Badge variant="secondary">Non disponible</Badge>
          ) : isConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-success/20 text-success border-success/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connecté
              </Badge>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleSync}
                disabled={syncCalendar.isPending}
                title="Synchroniser maintenant"
              >
                <RefreshCw className={`h-4 w-4 ${syncCalendar.isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDisconnect}
                disabled={disconnectGoogle.isPending}
                title="Déconnecter"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={connectGoogle.isPending}>
              {connectGoogle.isPending ? 'Connexion...' : 'Connecter'}
            </Button>
          )}
        </div>

        {/* Sync options when connected */}
        {isConnected && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-muted-foreground">Options de synchronisation</p>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Importer les événements</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Exporter les tâches</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Sync automatique</span>
              <Switch defaultChecked />
            </div>
          </div>
        )}

        {/* Apple Calendar (coming soon) */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 opacity-60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">Apple Calendar</p>
              <p className="text-xs text-muted-foreground">Bientôt disponible</p>
            </div>
          </div>
          <Badge variant="outline">À venir</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
