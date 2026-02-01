import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAINotifications } from '@/hooks/useAIBehavior';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Bell, Check, CheckCheck, AlertTriangle, TrendingUp, Zap, Brain, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const navigate = useNavigate();
  
  // AI-powered notifications
  const { 
    notifications: aiNotifications, 
    unreadCount: aiUnreadCount,
    isLoading: aiLoading,
    markAsRead: markAIRead 
  } = useAINotifications();
  
  // Legacy notifications
  const { data: legacyNotifications = [], isLoading: legacyLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'high':
        return <Zap className="w-5 h-5 text-warning" />;
      case 'low':
        return <TrendingUp className="w-5 h-5 text-success" />;
      default:
        return <Brain className="w-5 h-5 text-primary" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge variant="warning">Important</Badge>;
      case 'low':
        return <Badge variant="success">Info</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const handleNavigate = (url: string | null) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Notifications"
          subtitle="Reste informé"
          icon={<Bell className="h-5 w-5 text-white" />}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {aiUnreadCount > 0 
                ? `${aiUnreadCount} alerte${aiUnreadCount > 1 ? 's' : ''} comportementale${aiUnreadCount > 1 ? 's' : ''}`
                : 'Tout est sous contrôle'
              }
            </p>
          </div>

          {legacyNotifications.filter(n => !n.read).length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <Tabs defaultValue="ai" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Alertes IA
              {aiUnreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {aiUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Système
            </TabsTrigger>
          </TabsList>

          {/* AI Notifications */}
          <TabsContent value="ai">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Alertes Comportementales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Chargement...</div>
                ) : aiNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Aucune alerte comportementale</p>
                    <p className="text-sm text-muted-foreground/70">
                      L'IA surveille tes patterns et t'alertera si nécessaire
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`
                          p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md
                          ${!notification.delivered 
                            ? 'bg-accent/50 border-primary/20 shadow-sm' 
                            : 'bg-background/50 border-border/50'
                          }
                        `}
                        onClick={() => {
                          if (!notification.delivered) {
                            markAIRead(notification.id);
                          }
                          handleNavigate(notification.action_url);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getUrgencyIcon(notification.urgency || 'normal')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{notification.title}</h4>
                              {getUrgencyBadge(notification.urgency || 'normal')}
                              {!notification.delivered && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </div>
                              {notification.action_url && (
                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <ExternalLink className="w-3 h-3" />
                                  Voir
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Notifications */}
          <TabsContent value="system">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                {legacyLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Chargement...</div>
                ) : legacyNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Aucune notification système</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {legacyNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`
                          p-4 rounded-lg border transition-all
                          ${!notification.read 
                            ? 'bg-accent/50 border-primary/20 shadow-sm' 
                            : 'bg-background/50 border-border/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(notification.created_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead.mutate(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
