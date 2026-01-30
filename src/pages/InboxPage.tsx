import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Inbox as InboxIcon,
  Mail,
  FileText,
  Mic,
  ArrowRight,
  Trash2,
  Archive,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export default function InboxPage() {
  const { inboxItems, addInboxItem, convertInboxToTask, archiveInboxItem } = useAppStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    source: 'note',
  });

  const newItems = inboxItems.filter((i) => i.status === 'new');
  const archivedItems = inboxItems.filter((i) => i.status === 'archived');

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'capture':
        return <Mic className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) return;
    addInboxItem({
      title: newItem.title,
      content: newItem.content,
      source: newItem.source,
      status: 'new',
    });
    setNewItem({ title: '', content: '', source: 'note' });
    setIsAddOpen(false);
  };

  const InboxCard = ({ item }: { item: typeof inboxItems[0] }) => (
    <div className="group flex items-start gap-3 p-4 border-2 border-border hover:shadow-xs transition-all">
      <div className="mt-0.5 h-8 w-8 border-2 border-foreground flex items-center justify-center flex-shrink-0">
        {getSourceIcon(item.source)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{item.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 shadow-sm">
              <DropdownMenuItem
                className="gap-2"
                onClick={() => convertInboxToTask(item.id)}
              >
                <CheckSquare className="h-4 w-4" /> Convert to Task
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => archiveInboxItem(item.id)}
              >
                <Archive className="h-4 w-4" /> Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {item.content && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.content}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs capitalize">
            {item.source}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(item.createdAt), 'MMM d, h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
            <p className="text-muted-foreground">
              Capture ideas, process later. {newItems.length} items to review.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 border-2 shadow-xs">
                <Plus className="h-4 w-4" />
                Quick Capture
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 shadow-md">
              <DialogHeader>
                <DialogTitle>Quick Capture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>What's on your mind?</Label>
                  <Input
                    placeholder="Quick note, idea, or task..."
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Details (optional)</Label>
                  <Textarea
                    placeholder="Add more context..."
                    value={newItem.content}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    className="border-2 min-h-20"
                  />
                </div>
                <div className="flex gap-2">
                  {['note', 'email', 'capture'].map((source) => (
                    <button
                      key={source}
                      onClick={() => setNewItem({ ...newItem, source })}
                      className={cn(
                        'flex-1 py-2 px-3 border-2 flex items-center justify-center gap-2 transition-all capitalize',
                        newItem.source === source
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border hover:border-foreground'
                      )}
                    >
                      {getSourceIcon(source)}
                      {source}
                    </button>
                  ))}
                </div>
                <Button onClick={handleAddItem} className="w-full border-2 shadow-xs">
                  Capture
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="border-2 bg-background p-1">
            <TabsTrigger
              value="inbox"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              Inbox ({newItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              Archived ({archivedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {newItems.length === 0 ? (
              <Card className="border-2 shadow-sm">
                <CardContent className="py-12 text-center">
                  <InboxIcon className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium">Inbox Zero!</p>
                  <p className="text-sm text-muted-foreground">
                    All caught up. Capture new ideas with Quick Capture.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {newItems.map((item) => (
                  <InboxCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {archivedItems.length === 0 ? (
              <Card className="border-2 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Archive className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium">No archived items</p>
                  <p className="text-sm text-muted-foreground">
                    Archived items will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {archivedItems.map((item) => (
                  <InboxCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Processing Tips */}
        <Card className="border-2 border-dashed shadow-sm">
          <CardContent className="py-6">
            <h3 className="font-bold mb-3">Processing Rules</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 border-2 border-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">2 min rule:</strong> If it takes less than 2
                  minutes, do it now.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 border-2 border-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Convert:</strong> Transform actionable items
                  into tasks.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 border-2 border-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Archive:</strong> Reference material goes to
                  the archive.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
