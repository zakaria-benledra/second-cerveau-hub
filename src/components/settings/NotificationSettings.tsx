import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function NotificationSettings() {
  const { isSupported, permission, isSubscribed, isCheckingSubscription, subscribe, unsubscribe } = usePushNotifications();
  const { toast } = useToast();

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe.mutateAsync();
        toast({ title: 'Notifications désactivées' });
      } else {
        await subscribe.mutateAsync();
        toast({ title: 'Notifications activées ✅' });
      }
    } catch (error: any) {
      if (error.message === 'Permission denied') {
        toast({
          title: 'Permission refusée',
          description: 'Active les notifications dans les paramètres de ton navigateur',
          variant: 'destructive',
        });
      } else if (error.message === 'VAPID key not configured') {
        toast({
          title: 'Configuration incomplète',
          description: 'Les notifications push ne sont pas encore configurées',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer les notifications',
          variant: 'destructive',
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Card className="glass border-warning/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-warning">
            <BellOff className="h-5 w-5" />
            <p className="text-sm">
              Notifications non supportées sur ce navigateur.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Rappels et alertes même quand l'app est fermée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Notifications push</Label>
          <div className="flex items-center gap-2">
            {permission === 'denied' && (
              <Badge variant="destructive">Bloquées</Badge>
            )}
            <Switch
              data-testid="push-notifications-switch"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isCheckingSubscription || subscribe.isPending || unsubscribe.isPending || permission === 'denied'}
            />
          </div>
        </div>

        {permission === 'denied' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Notifications bloquées. Active-les dans les paramètres du navigateur.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <p className="text-sm font-medium text-muted-foreground">Types de notifications</p>
            <div className="flex items-center justify-between">
              <Label>Alertes comportementales</Label>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between">
              <Label>Rappels d'habitudes</Label>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between">
              <Label>Milestones & victoires</Label>
              <Switch defaultChecked disabled />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Le contrôle granulaire des types sera disponible prochainement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
