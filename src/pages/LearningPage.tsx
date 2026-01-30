import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReadingItems, useCreateReadingItem, useUpdateReadingItem, useDeleteReadingItem, useFlashcards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useLearning';
import { BookOpen, Plus, ExternalLink, Brain, Trash2, GraduationCap } from 'lucide-react';

export default function LearningPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', url: '', author: '' });
  const [newCard, setNewCard] = useState({ front: '', back: '', deck: 'default' });

  const { data: readingItems = [], isLoading: loadingReading } = useReadingItems();
  const { data: flashcards = [], isLoading: loadingCards } = useFlashcards();
  const createReading = useCreateReadingItem();
  const updateReading = useUpdateReadingItem();
  const deleteReading = useDeleteReadingItem();
  const createCard = useCreateFlashcard();
  const deleteCard = useDeleteFlashcard();

  const handleAddReading = () => {
    if (!newItem.title) return;
    createReading.mutate({ 
      title: newItem.title, 
      url: newItem.url || null, 
      author: newItem.author || null 
    }, {
      onSuccess: () => {
        setNewItem({ title: '', url: '', author: '' });
        setIsAddOpen(false);
      }
    });
  };

  const handleAddFlashcard = () => {
    if (!newCard.front || !newCard.back) return;
    createCard.mutate(newCard, {
      onSuccess: () => {
        setNewCard({ front: '', back: '', deck: 'default' });
        setIsFlashcardOpen(false);
      }
    });
  };

  const statusColors: Record<string, string> = {
    to_read: 'bg-muted text-muted-foreground',
    reading: 'bg-primary/10 text-primary',
    completed: 'bg-accent text-accent-foreground',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Apprentissage</h1>
            <p className="text-muted-foreground">Lectures, flashcards et quiz</p>
          </div>
        </div>

        <Tabs defaultValue="reading" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="reading" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lectures
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reading" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une lecture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Titre *</Label>
                      <Input
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="Titre de l'article ou du livre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auteur</Label>
                      <Input
                        value={newItem.author}
                        onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                        placeholder="Nom de l'auteur"
                      />
                    </div>
                    <Button onClick={handleAddReading} className="w-full" disabled={createReading.isPending}>
                      {createReading.isPending ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingReading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : readingItems.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucune lecture en cours.<br />
                    Ajoutez des articles ou livres à lire.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {readingItems.map((item) => (
                  <Card key={item.id} className="glass group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                        <Badge className={statusColors[item.status] || 'bg-muted'}>
                          {item.status === 'to_read' ? 'À lire' : 
                           item.status === 'reading' ? 'En cours' : 'Terminé'}
                        </Badge>
                      </div>
                      {item.author && (
                        <CardDescription>{item.author}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {item.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => window.open(item.url!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ouvrir
                          </Button>
                        )}
                        <Select
                          value={item.status}
                          onValueChange={(status) => updateReading.mutate({ id: item.id, updates: { status } })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="to_read">À lire</SelectItem>
                            <SelectItem value="reading">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => deleteReading.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isFlashcardOpen} onOpenChange={setIsFlashcardOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle carte
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une flashcard</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Question (recto) *</Label>
                      <Textarea
                        value={newCard.front}
                        onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                        placeholder="Qu'est-ce que..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Réponse (verso) *</Label>
                      <Textarea
                        value={newCard.back}
                        onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                        placeholder="C'est..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deck</Label>
                      <Input
                        value={newCard.deck}
                        onChange={(e) => setNewCard({ ...newCard, deck: e.target.value })}
                        placeholder="default"
                      />
                    </div>
                    <Button onClick={handleAddFlashcard} className="w-full" disabled={createCard.isPending}>
                      {createCard.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingCards ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : flashcards.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucune flashcard.<br />
                    Créez des cartes pour mémoriser.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {flashcards.map((card) => (
                  <Card key={card.id} className="glass group cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">{card.deck}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-destructive h-6 w-6"
                          onClick={() => deleteCard.mutate(card.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium mb-2">{card.front}</p>
                      <p className="text-muted-foreground text-sm">{card.back}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quiz">
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Testez vos connaissances avec un quiz.
                </p>
                <Button disabled={flashcards.length < 4}>
                  {flashcards.length < 4 ? 
                    `Besoin de ${4 - flashcards.length} cartes de plus` : 
                    'Démarrer le quiz'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
