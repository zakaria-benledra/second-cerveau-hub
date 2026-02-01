import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';
import { useAuth, signOut } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Bell, Volume2, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

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

        {/* Préférences */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
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
