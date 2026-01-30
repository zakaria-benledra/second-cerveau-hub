import { Menu, Bell, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { inboxItems } = useAppStore();
  const unreadCount = inboxItems.filter((i) => i.status === 'new').length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-border bg-background px-4 md:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden border-2 border-transparent hover:border-border"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 border-2 focus:shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-2 shadow-xs hover:shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Quick Add</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative border-2 border-transparent hover:border-border">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
          <div className="h-8 w-8 border-2 border-foreground bg-accent flex items-center justify-center font-bold text-sm">
            JD
          </div>
        </Button>
      </div>
    </header>
  );
}
