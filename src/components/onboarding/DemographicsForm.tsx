import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';

interface DemographicsFormProps {
  onComplete?: () => void;
  mode?: 'wizard' | 'settings';
}

export function DemographicsForm({ onComplete, mode = 'settings' }: DemographicsFormProps) {
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [birthYear, setBirthYear] = useState<string>('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');

  useEffect(() => {
    if (profile) {
      setBirthYear(profile.birth_year?.toString() || '');
      setCountry(profile.location_country || '');
      setCity(profile.location_city || '');
      setGender(profile.gender || 'prefer_not_to_say');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        birth_year: birthYear ? parseInt(birthYear) : null,
        location_country: country || null,
        location_city: city || null,
        gender: gender,
      });
      toast({ title: 'Profil mis à jour ✅' });
      onComplete?.();
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => (currentYear - 18 - i).toString());

  const content = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ces informations sont optionnelles et servent à personnaliser tes recommandations.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Année de naissance */}
        <div className="space-y-2">
          <Label>Année de naissance</Label>
          <Select value={birthYear} onValueChange={setBirthYear}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">Non précisé</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre */}
        <div className="space-y-2">
          <Label>Genre</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prefer_not_to_say">Ne pas préciser</SelectItem>
              <SelectItem value="male">Homme</SelectItem>
              <SelectItem value="female">Femme</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pays */}
        <div className="space-y-2">
          <Label>Pays</Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="France"
          />
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <Label>Ville</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris"
          />
        </div>
      </div>

      {mode === 'settings' && (
        <div className="pt-2">
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      )}
    </div>
  );

  if (mode === 'wizard') {
    return content;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Informations démographiques
        </CardTitle>
        <CardDescription>
          Optionnel — aide Sage à mieux te comprendre
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
