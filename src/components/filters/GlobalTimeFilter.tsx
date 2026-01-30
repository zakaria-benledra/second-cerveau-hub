import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export type TimeRange = '1d' | '7d' | '30d' | '90d' | 'custom';

interface GlobalTimeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

export function GlobalTimeFilter({ value, onChange, className }: GlobalTimeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1d">Aujourd'hui</SelectItem>
        <SelectItem value="7d">7 jours</SelectItem>
        <SelectItem value="30d">30 jours</SelectItem>
        <SelectItem value="90d">90 jours</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Utility hook to calculate date range from TimeRange
export function useTimeRangeDates(range: TimeRange) {
  return useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case '1d':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startTimestamp: startDate.toISOString(),
      endTimestamp: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  }, [range]);
}

// Utility to get days from range
export function rangeToDays(range: TimeRange): number {
  switch (range) {
    case '1d': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}
