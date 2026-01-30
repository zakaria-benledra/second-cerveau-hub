import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Win, WinCategory } from "@/hooks/useWins";

interface WinCardProps {
  win: Win;
  onEdit: (win: Win) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_STYLES: Record<WinCategory, { color: string; label: string }> = {
  habit: { color: "border-l-success", label: "Habitude" },
  task: { color: "border-l-primary", label: "Tâche" },
  goal: { color: "border-l-warning", label: "Objectif" },
  finance: { color: "border-l-info", label: "Finance" },
  health: { color: "border-l-destructive", label: "Santé" },
  other: { color: "border-l-muted-foreground", label: "Autre" },
};

export function WinCard({ win, onEdit, onDelete }: WinCardProps) {
  const categoryStyle = win.category
    ? CATEGORY_STYLES[win.category]
    : { color: "border-l-muted-foreground", label: "Non catégorisé" };

  return (
    <Card
      className={`border-l-4 ${categoryStyle.color} hover:shadow-lg transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-warning shrink-0" />
              <h3 className="font-semibold text-foreground truncate">
                {win.title}
              </h3>
            </div>

            {win.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {win.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                {format(new Date(win.achieved_at), "d MMM yyyy", { locale: fr })}
              </span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {categoryStyle.label}
              </Badge>
            </div>

            {win.tags && win.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {win.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {(win.score_impact ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-success font-semibold text-sm">
                <TrendingUp className="h-3 w-3" />
                +{win.score_impact}
              </div>
            )}

            <div className="flex gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onEdit(win)}
                className="h-7 w-7"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onDelete(win.id)}
                className="h-7 w-7 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
