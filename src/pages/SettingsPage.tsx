import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';
import { useUserPreferences } from '@/hooks/useOnboarding';
import { useAuth, signOut } from '@/hooks/useAuth';
import { useConsents, useUpdateConsent, useExportUserData, CONSENT_PURPOSES } from '@/hooks/useConsents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Volume2, LogOut, Shield, Download, Trash2, Target, Brain, Wallet, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: preferences } = useUserPreferences();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // GDPR Consent hooks
  const { data: consents, isLoading: consentsLoading } = useConsents();
  const updateConsent = useUpdateConsent();
  const exportData = useExportUserData();

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setSoundEnabled(profile.sound_enabled ?? true);
    }
  }, [profile]);
  
  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        sound_enabled: soundEnabled,
      });
      toast({ title: 'Paramètres sauvegardés ✅' });
    } catch (error) {
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleConsentChange = async (purpose: string, granted: boolean) => {
    try {
      await updateConsent.mutateAsync({ purpose, granted });
      toast({ title: granted ? 'Consentement activé ✅' : 'Consentement retiré' });
    } catch (error: any) {
      toast({ 
        title: error.message || 'Erreur lors de la mise à jour', 
        variant: 'destructive' 
      });
    }
  };

  const handleExportData = async () => {
    try {
      await exportData.mutateAsync();
      toast({ title: 'Données exportées avec succès ✅' });
    } catch (error) {
      toast({ title: 'Erreur lors de l\'export', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-user-account');
      if (error) throw error;
      await signOut();
    } catch (error) {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <GlobalHeader
          variant="page"
          title="Paramètres"
          subtitle="Personnalise ton expérience"
          icon={<Settings className="h-5 w-5 text-primary" />}
        />

        <SageCompanion context="settings" mood="neutral" variant="inline" />

        {/* Profil */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ton prénom"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profil de Transformation */}
        {preferences && (preferences.goal_discipline > 0 || preferences.goal_mental_balance > 0 || preferences.goal_financial_stability > 0) && (
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Mon profil de transformation
              </CardTitle>
              <CardDescription>
                Défini lors de ton inscription, utilisé par Sage pour personnaliser tes conseils
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discipline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-warning" />
                    <span className="font-medium">Discipline</span>
                  </div>
                  <Badge variant={preferences.goal_discipline >= 70 ? 'default' : 'secondary'}>
                    {preferences.goal_discipline}%
                  </Badge>
                </div>
                <Progress value={preferences.goal_discipline} className="h-2" />
              </div>
              
              {/* Équilibre mental */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent" />
                    <span className="font-medium">Équilibre mental</span>
                  </div>
                  <Badge variant={preferences.goal_mental_balance >= 70 ? 'default' : 'secondary'}>
                    {preferences.goal_mental_balance}%
                  </Badge>
                </div>
                <Progress value={preferences.goal_mental_balance} className="h-2" />
              </div>
              
              {/* Stabilité financière */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-success" />
                    <span className="font-medium">Stabilité financière</span>
                  </div>
                  <Badge variant={preferences.goal_financial_stability >= 70 ? 'default' : 'secondary'}>
                    {preferences.goal_financial_stability}%
                  </Badge>
                </div>
                <Progress value={preferences.goal_financial_stability} className="h-2" />
              </div>
              
              <p className="text-xs text-muted-foreground pt-2">
                Ces objectifs influencent les recommandations de Sage. Ils ne peuvent pas être modifiés pour le moment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Préférences */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Préférences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Sons et effets</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Jouer des sons lors des actions
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité & RGPD */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Confidentialité & Données
            </CardTitle>
            <CardDescription>
              Gère tes préférences conformément au RGPD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Personnalisation IA */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium">{CONSENT_PURPOSES.AI_PERSONALIZATION.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {CONSENT_PURPOSES.AI_PERSONALIZATION.description}
                  </p>
                </div>
                <Switch
                  checked={consents?.[CONSENT_PURPOSES.AI_PERSONALIZATION.id] ?? false}
                  onCheckedChange={(v) => handleConsentChange(CONSENT_PURPOSES.AI_PERSONALIZATION.id, v)}
                  disabled={consentsLoading || updateConsent.isPending}
                />
              </div>

              {/* Analyse comportementale */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium">{CONSENT_PURPOSES.BEHAVIORAL_ANALYSIS.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {CONSENT_PURPOSES.BEHAVIORAL_ANALYSIS.description}
                  </p>
                </div>
                <Switch
                  checked={consents?.[CONSENT_PURPOSES.BEHAVIORAL_ANALYSIS.id] ?? false}
                  onCheckedChange={(v) => handleConsentChange(CONSENT_PURPOSES.BEHAVIORAL_ANALYSIS.id, v)}
                  disabled={consentsLoading || updateConsent.isPending}
                />
              </div>

              {/* Amélioration produit */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium">{CONSENT_PURPOSES.PRODUCT_IMPROVEMENT.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {CONSENT_PURPOSES.PRODUCT_IMPROVEMENT.description}
                  </p>
                </div>
                <Switch
                  checked={consents?.[CONSENT_PURPOSES.PRODUCT_IMPROVEMENT.id] ?? false}
                  onCheckedChange={(v) => handleConsentChange(CONSENT_PURPOSES.PRODUCT_IMPROVEMENT.id, v)}
                  disabled={consentsLoading || updateConsent.isPending}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="font-medium">Tes données</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={exportData.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportData.isPending ? 'Export...' : 'Exporter mes données'}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Supprimer définitivement ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Toutes tes données seront supprimées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Conformément au RGPD, tu peux exporter ou supprimer tes données.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>

        <Separator />

        {/* Zone danger */}
        <Card className="glass border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Zone sensible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Déconnexion</p>
                <p className="text-sm text-muted-foreground">
                  Te déconnecter de ton compte
                </p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
