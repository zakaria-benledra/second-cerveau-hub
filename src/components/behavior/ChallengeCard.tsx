import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Target,
  Check,
  Gift,
  MoreVertical,
  Trash2,
  XCircle,
  Calendar,
  Trophy,
} from "lucide-react";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Challenge } from "@/hooks/useChallenges";

interface ChallengeCardProps {
  challenge: Challenge;
  isTodayCompleted: boolean;
  onMarkToday: () => void;
  onAbandon: () => void;
  onDelete: () => void;
  isMarkingToday?: boolean;
}

export function ChallengeCard({
  challenge,
  isTodayCompleted,
  onMarkToday,
  onAbandon,
  onDelete,
  isMarkingToday,
}: ChallengeCardProps) {
  const progressPercent = Math.round(
    (challenge.days_completed / challenge.duration) * 100
  );
  const daysRemaining = challenge.duration - challenge.days_completed;
  const isActive = challenge.status === "active";
  const isCompleted = challenge.status === "completed";

  const endDate = addDays(parseISO(challenge.started_at), challenge.duration);

  return (
    <Card
      className={`border-l-4 transition-all ${
        isCompleted
          ? "border-l-success bg-success/5"
          : "border-l-primary hover:shadow-lg"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {isCompleted ? (
                <Trophy className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Target className="h-5 w-5 text-primary shrink-0" />
              )}
              <h3 className="font-semibold text-foreground truncate">
                {challenge.name}
              </h3>
              {isCompleted && (
                <Badge variant="success" className="shrink-0">
                  Complété
                </Badge>
              )}
            </div>

            {/* Description */}
            {challenge.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {challenge.description}
              </p>
            )}

            {/* Progress */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {challenge.days_completed} / {challenge.duration} jours
                </span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Info row */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              {isActive && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysRemaining} jours restants
                </Badge>
              )}

              {challenge.reward && (
                <Badge variant="secondary" className="gap-1">
                  <Gift className="h-3 w-3" />
                  {challenge.reward}
                </Badge>
              )}

              {isCompleted && challenge.completed_at && (
                <span>
                  Terminé le{" "}
                  {format(parseISO(challenge.completed_at), "d MMM yyyy", {
                    locale: fr,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isActive && (
              <>
                {isTodayCompleted ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    Fait aujourd'hui
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={onMarkToday}
                    disabled={isMarkingToday}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Fait !
                  </Button>
                )}
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isActive && (
                  <DropdownMenuItem
                    onClick={onAbandon}
                    className="text-warning"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Abandonner
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
