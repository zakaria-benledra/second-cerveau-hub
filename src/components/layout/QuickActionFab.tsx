import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ListTodo, Sparkles, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActionFab() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: ListTodo, label: 'Nouvelle tâche', path: '/tasks?new=true' },
    { icon: Sparkles, label: 'Nouvelle habitude', path: '/habits?new=true' },
    { icon: BookOpen, label: 'Écrire dans le journal', path: '/journal?new=true' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-lg"
            className={cn(
              "rounded-full shadow-lg transition-transform",
              isOpen && "rotate-45"
            )}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.path}
              onClick={() => {
                navigate(action.path);
                setIsOpen(false);
              }}
              className="gap-2 py-3"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
