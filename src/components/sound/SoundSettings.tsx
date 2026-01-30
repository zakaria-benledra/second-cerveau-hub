import { useSoundSettings, useSound } from '@/hooks/useSound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Bell } from 'lucide-react';

export function SoundSettings() {
  const { settings, updateSettings } = useSoundSettings();
  const { play } = useSound();

  const testSound = () => {
    play('task_done');
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Sons de feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="flex items-center gap-2">
            {settings.enabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            Activer les sons
          </Label>
          <Switch
            id="sound-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Volume: {Math.round(settings.volume * 100)}%
              </Label>
              <Slider
                value={[settings.volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([volume]) => updateSettings({ volume })}
                className="w-full"
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={testSound}
              className="w-full"
            >
              Tester le son
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
