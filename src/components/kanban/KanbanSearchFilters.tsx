import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlobalTimeFilter, type TimeRange } from '@/components/filters/GlobalTimeFilter';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'created' | 'due_date' | 'priority' | 'impact';
export type PriorityFilter = 'all' | 'urgent' | 'high' | 'medium' | 'low';

interface KanbanSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function KanbanSearchFilters({
  searchQuery,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  sortBy,
  onSortChange,
  priorityFilter,
  onPriorityChange,
  activeFiltersCount,
  onClearFilters,
}: KanbanSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-3">
      {/* Main Search Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9 glass-hover"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl glass animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Période:</span>
            <GlobalTimeFilter 
              value={timeRange} 
              onChange={onTimeRangeChange} 
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Priorité:</span>
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                <SelectItem value="high">🟠 Haute</SelectItem>
                <SelectItem value="medium">🟡 Moyenne</SelectItem>
                <SelectItem value="low">⚪ Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trier par:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date création</SelectItem>
                <SelectItem value="due_date">Échéance</SelectItem>
                <SelectItem value="priority">Priorité</SelectItem>
                <SelectItem value="impact">Score impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
