import { Link } from 'react-router-dom';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BIBreadcrumbProps {
  currentPage: string;
}

export function BIBreadcrumb({ currentPage }: BIBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Link 
        to="/bi/executive" 
        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        <BarChart3 className="h-4 w-4" />
        Dashboard Exécutif
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium flex items-center gap-2">
        {currentPage}
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
          BI
        </Badge>
      </span>
    </nav>
  );
}
