import { useState } from "react";
import { WIN_CATEGORY_FILTERS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trophy, TrendingUp, Filter } from "lucide-react";
import { useWins, type WinCategory, type Win, type WinInput } from "@/hooks/useWins";
import { WinCard } from "./WinCard";
import { WinFormModal } from "./WinFormModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function WinsTracker() {
  const [categoryFilter, setCategoryFilter] = useState<WinCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWin, setEditingWin] = useState<Win | null>(null);

  const { wins, stats, isLoading, createWin, updateWin, deleteWin } =
    useWins(categoryFilter);

  const handleSubmit = (data: WinInput) => {
    if (editingWin) {
      updateWin.mutate(
        { id: editingWin.id, ...data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingWin(null);
          },
        }
      );
    } else {
      createWin.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  const handleEdit = (win: Win) => {
    setEditingWin(win);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette victoire ?")) {
      deleteWin.mutate(id);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setEditingWin(null);
  };

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-warning" />
            Mes Victoires
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Célèbre tes accomplissements
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Victoire
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalWins}</p>
              <p className="text-xs text-muted-foreground">Total victoires</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">+{stats.totalImpact}</p>
              <p className="text-xs text-muted-foreground">Impact score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {WIN_CATEGORY_FILTERS.find((c) => c.value === categoryFilter)?.label || "Toutes"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {WIN_CATEGORY_FILTERS.map((cat) => (
              <DropdownMenuItem
                key={cat.value ?? "all"}
                onClick={() => setCategoryFilter(cat.value)}
                className={categoryFilter === cat.value ? "bg-accent" : ""}
              >
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {categoryFilter && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setCategoryFilter(null)}
          >
            {WIN_CATEGORY_FILTERS.find((c) => c.value === categoryFilter)?.label}
            <span className="ml-1">×</span>
          </Badge>
        )}
      </div>

      {/* Liste des victoires */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : wins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {categoryFilter
                  ? "Aucune victoire dans cette catégorie"
                  : "Aucune victoire enregistrée"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Commence à tracker tes accomplissements !
              </p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ma première victoire
              </Button>
            </CardContent>
          </Card>
        ) : (
          wins.map((win) => (
            <WinCard
              key={win.id}
              win={win}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <WinFormModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        onSubmit={handleSubmit}
        editWin={editingWin}
        isSubmitting={createWin.isPending || updateWin.isPending}
      />
    </div>
  );
}
