import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ChallengeInput } from "@/hooks/useChallenges";

interface ChallengeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChallengeInput) => void;
  isSubmitting?: boolean;
}

export function ChallengeFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ChallengeFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number | "">(30);
  const [reward, setReward] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setDuration(30);
      setReward("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !duration) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      duration: Number(duration),
      reward: reward.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🎯 Nouveau Défi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du défi *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 30 jours sans sucre"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris ton défi..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durée (jours) *</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={365}
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value ? Number(e.target.value) : "")
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward">Récompense</Label>
              <Input
                id="reward"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="Ex: Restaurant"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !duration || isSubmitting}
            >
              {isSubmitting ? "..." : "Créer le défi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
