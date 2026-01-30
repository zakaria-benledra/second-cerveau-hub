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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { Win, WinCategory, WinInput } from "@/hooks/useWins";

interface WinFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WinInput) => void;
  editWin?: Win | null;
  isSubmitting?: boolean;
}

const CATEGORIES: { value: WinCategory; label: string; color: string }[] = [
  { value: "habit", label: "Habitude", color: "bg-success" },
  { value: "task", label: "Tâche", color: "bg-primary" },
  { value: "goal", label: "Objectif", color: "bg-warning" },
  { value: "finance", label: "Finance", color: "bg-info" },
  { value: "health", label: "Santé", color: "bg-destructive" },
  { value: "other", label: "Autre", color: "bg-muted" },
];

export function WinFormModal({
  open,
  onOpenChange,
  onSubmit,
  editWin,
  isSubmitting,
}: WinFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WinCategory | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [achievedAt, setAchievedAt] = useState("");
  const [scoreImpact, setScoreImpact] = useState<number | "">("");

  useEffect(() => {
    if (editWin) {
      setTitle(editWin.title);
      setDescription(editWin.description || "");
      setCategory(editWin.category || "");
      setTags(editWin.tags || []);
      setAchievedAt(editWin.achieved_at);
      setScoreImpact(editWin.score_impact ?? "");
    } else {
      resetForm();
    }
  }, [editWin, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTags([]);
    setTagInput("");
    setAchievedAt(new Date().toISOString().split("T")[0]);
    setScoreImpact("");
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      achieved_at: achievedAt || undefined,
      score_impact: scoreImpact !== "" ? Number(scoreImpact) : undefined,
    });

    if (!editWin) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editWin ? "Modifier la victoire" : "🏆 Nouvelle Victoire"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Terminé mon premier marathon"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris ta victoire..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as WinCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="achieved_at">Date</Label>
              <Input
                id="achieved_at"
                type="date"
                value={achievedAt}
                onChange={(e) => setAchievedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="score_impact">Impact sur le score (points)</Label>
            <Input
              id="score_impact"
              type="number"
              min={0}
              max={100}
              value={scoreImpact}
              onChange={(e) =>
                setScoreImpact(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ex: 10"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? "..." : editWin ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
