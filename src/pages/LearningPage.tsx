import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useReadingItems, useCreateReadingItem, useUpdateReadingItem, useDeleteReadingItem, useFlashcards, useCreateFlashcard, useDeleteFlashcard, useSaveQuizResult, useQuizResults } from '@/hooks/useLearning';
import { useGoals } from '@/hooks/useProjects';
import { ScoreRing } from '@/components/today/ScoreRing';
import {
  BookOpen, 
  Plus, 
  ExternalLink, 
  Brain, 
  Trash2, 
  GraduationCap,
  Sparkles, 
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  Trophy,
  History,
  ChevronRight,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// AI-generated question templates based on readings
const generateAIQuestions = (readings: any[], flashcards: any[], goals: any[]) => {
  const questions: { question: string; options: string[]; correct: number; source: string; category: string }[] = [];
  
  // Generate from readings
  readings.filter(r => r.status === 'completed').forEach(reading => {
    questions.push({
      question: `Quel est le concept principal du livre "${reading.title}" ?`,
      options: [
        'Une stratégie de productivité',
        'Une méthode d\'apprentissage',
        'Un framework de décision',
        'Une technique de méditation'
      ],
      correct: Math.floor(Math.random() * 4),
      source: reading.title,
      category: 'Lecture'
    });
  });

  // Generate from flashcards
  flashcards.slice(0, 5).forEach(card => {
    questions.push({
      question: card.front,
      options: [
        card.back,
        'Réponse incorrecte A',
        'Réponse incorrecte B',
        'Réponse incorrecte C'
      ].sort(() => Math.random() - 0.5),
      correct: 0,
      source: `Flashcard - ${card.deck}`,
      category: 'Mémoire'
    });
  });

  // Generate from goals
  goals.slice(0, 2).forEach(goal => {
    questions.push({
      question: `Pourquoi l'objectif "${goal.title}" est-il important pour votre développement ?`,
      options: [
        'Améliore la discipline personnelle',
        'Contribue à la croissance financière',
        'Renforce les compétences techniques',
        'Développe le réseau professionnel'
      ],
      correct: Math.floor(Math.random() * 4),
      source: goal.title,
      category: 'Objectifs'
    });
  });

  // Culture générale - always available
  const cultureQuestions = [
    {
      question: 'Quel est le principe de Pareto ?',
      options: ['80/20 - 80% des résultats viennent de 20% des efforts', '50/50 - équilibre parfait', '90/10 - concentration maximale', '70/30 - règle de diversification'],
      correct: 0,
      source: 'Culture générale',
      category: 'Productivité'
    },
    {
      question: 'Qu\'est-ce que le "Deep Work" selon Cal Newport ?',
      options: ['Travail superficiel', 'Travail profond sans distraction', 'Travail en équipe', 'Travail nocturne'],
      correct: 1,
      source: 'Culture générale',
      category: 'Productivité'
    },
    {
      question: 'Quel est l\'effet Zeigarnik ?',
      options: ['On retient mieux les tâches incomplètes', 'On oublie les succès', 'On procrastine naturellement', 'On surestime le temps'],
      correct: 0,
      source: 'Culture générale',
      category: 'Psychologie'
    },
    {
      question: 'Qu\'est-ce que la technique Pomodoro ?',
      options: ['Méditation', '25min travail + 5min pause', 'Planification hebdomadaire', 'Priorisation ABC'],
      correct: 1,
      source: 'Culture générale',
      category: 'Productivité'
    },
    {
      question: 'Que signifie SMART pour un objectif ?',
      options: ['Simple, Minimal, Adapté, Rapide, Testable', 'Spécifique, Mesurable, Atteignable, Réaliste, Temporel', 'Stratégique, Motivant, Ambitieux, Révolutionnaire, Transformateur', 'Stable, Modulable, Ajustable, Révisable, Trackable'],
      correct: 1,
      source: 'Culture générale',
      category: 'Objectifs'
    }
  ];

  return [...questions, ...cultureQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
};

export default function LearningPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', url: '', author: '', goal_id: '' });
  const [newCard, setNewCard] = useState({ front: '', back: '', deck: 'default' });
  const [activeTab, setActiveTab] = useState('reading');

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<ReturnType<typeof generateAIQuestions>>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<{ correct: boolean; selected: number }[]>([]);

  const { data: readingItems = [], isLoading: loadingReading } = useReadingItems();
  const { data: flashcards = [], isLoading: loadingCards } = useFlashcards();
  const { data: goals = [] } = useGoals();
  const { data: quizResults = [] } = useQuizResults();
  const createReading = useCreateReadingItem();
  const updateReading = useUpdateReadingItem();
  const deleteReading = useDeleteReadingItem();
  const createCard = useCreateFlashcard();
  const deleteCard = useDeleteFlashcard();
  const saveQuizResult = useSaveQuizResult();

  // Stats
  const completedReadings = readingItems.filter(r => r.status === 'completed').length;
  const totalReadings = readingItems.length;
  const readingProgress = totalReadings > 0 ? Math.round((completedReadings / totalReadings) * 100) : 0;
  
  const avgQuizScore = quizResults.length > 0 
    ? Math.round(quizResults.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) / quizResults.length)
    : 0;

  // Growth index based on learning activity
  const growthIndex = Math.min(100, Math.round(
    (completedReadings * 10) + 
    (flashcards.length * 2) + 
    (avgQuizScore * 0.5)
  ));

  const handleAddReading = () => {
    if (!newItem.title) return;
    createReading.mutate({ 
      title: newItem.title, 
      url: newItem.url || null, 
      author: newItem.author || null 
    }, {
      onSuccess: () => {
        setNewItem({ title: '', url: '', author: '', goal_id: '' });
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

  // Quiz handlers
  const startQuiz = () => {
    const questions = generateAIQuestions(readingItems, flashcards, goals);
    setQuizQuestions(questions);
    setQuizActive(true);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnsweredQuestions([]);
    setActiveTab('quiz');
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    
    const isCorrect = index === quizQuestions[currentQuestion].correct;
    if (isCorrect) setScore(s => s + 1);
    
    setAnsweredQuestions([...answeredQuestions, { correct: isCorrect, selected: index }]);
    
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        saveQuizResult.mutate({ score: score + (isCorrect ? 1 : 0), total: quizQuestions.length });
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setShowResult(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
  };

  const statusColors: Record<string, string> = {
    to_read: 'bg-muted text-muted-foreground',
    reading: 'bg-primary/10 text-primary',
    completed: 'bg-success/10 text-success',
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Apprentissage"
          subtitle="Continue à progresser"
          icon={<GraduationCap className="h-5 w-5 text-white" />}
        />

        <SageCompanion context="goals" mood="happy" variant="inline" className="mb-4" />

        {/* Header with Growth Index */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div></div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={startQuiz} 
              className="gradient-primary text-primary-foreground shadow-lg gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Quiz du jour
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-strong md:row-span-2">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <ScoreRing
                value={growthIndex}
                size="xl"
                label="Growth Index"
                sublabel="Croissance intellectuelle"
              />
              <div className="flex items-center gap-1 mt-4">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">
                  {growthIndex >= 70 ? 'Excellent !' : growthIndex >= 40 ? 'En progression' : 'Commencez !'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{completedReadings}/{totalReadings}</p>
                  <p className="text-xs text-muted-foreground">Lectures terminées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15">
                  <Brain className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{flashcards.length}</p>
                  <p className="text-xs text-muted-foreground">Flashcards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/15">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{avgQuizScore}%</p>
                  <p className="text-xs text-muted-foreground">Score moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Quiz History */}
          <Card className="glass-hover md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Derniers quiz</span>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                      Historique <ChevronRight className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="glass-strong">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historique des quiz
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-3">
                      {quizResults.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun quiz passé</p>
                      ) : (
                        quizResults.map((result, i) => (
                          <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="font-medium">{result.deck || 'Quiz général'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(result.created_at), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <Badge className={cn(
                              (result.score / result.total) >= 0.7 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                            )}>
                              {result.score}/{result.total}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex items-end justify-between gap-1 h-12">
                {quizResults.slice(0, 7).reverse().map((result, i) => (
                  <div 
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div 
                      className={cn(
                        'w-full rounded-sm transition-all',
                        (result.score / result.total) >= 0.7 ? 'bg-success' : 
                        (result.score / result.total) >= 0.4 ? 'bg-warning' : 'bg-destructive/50'
                      )}
                      style={{ height: `${Math.max(4, (result.score / result.total) * 48)}px` }}
                    />
                  </div>
                ))}
                {quizResults.length < 7 && Array.from({ length: 7 - quizResults.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1">
                    <div className="w-full h-1 rounded-sm bg-muted" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="glass-strong">
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
              {quizActive && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary">!</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Reading Tab */}
          <TabsContent value="reading" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-primary">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
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
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder="https://..."
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auteur</Label>
                      <Input
                        value={newItem.author}
                        onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                        placeholder="Nom de l'auteur"
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Lier à un objectif
                      </Label>
                      <Select value={newItem.goal_id} onValueChange={(v) => setNewItem({ ...newItem, goal_id: v })}>
                        <SelectTrigger className="glass-hover">
                          <SelectValue placeholder="Sélectionner un objectif..." />
                        </SelectTrigger>
                        <SelectContent>
                          {goals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddReading} className="w-full gradient-primary" disabled={createReading.isPending}>
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
                  <Card key={item.id} className="glass-hover group">
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

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isFlashcardOpen} onOpenChange={setIsFlashcardOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-primary">
                    <Plus className="h-4 w-4" />
                    Nouvelle carte
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
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
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Réponse (verso) *</Label>
                      <Textarea
                        value={newCard.back}
                        onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                        placeholder="C'est..."
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deck</Label>
                      <Input
                        value={newCard.deck}
                        onChange={(e) => setNewCard({ ...newCard, deck: e.target.value })}
                        placeholder="default"
                        className="glass-hover"
                      />
                    </div>
                    <Button onClick={handleAddFlashcard} className="w-full gradient-primary" disabled={createCard.isPending}>
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
                  <Card key={card.id} className="glass-hover group cursor-pointer hover:shadow-lg transition-shadow">
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

          {/* Quiz Tab - AI Generated */}
          <TabsContent value="quiz" className="space-y-4">
            {!quizActive ? (
              <Card className="glass-strong">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <GraduationCap className="h-16 w-16 text-primary relative z-10" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quiz Adaptatif IA</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Questions générées à partir de vos lectures, flashcards et objectifs.
                    Le score alimente votre <strong>Growth Index</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {completedReadings} lectures
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Brain className="h-3 w-3" />
                      {flashcards.length} flashcards
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" />
                      {goals.length} objectifs
                    </Badge>
                  </div>
                  <Button onClick={startQuiz} className="gradient-primary text-primary-foreground shadow-lg gap-2">
                    <Sparkles className="h-4 w-4" />
                    Démarrer le quiz
                  </Button>
                </CardContent>
              </Card>
            ) : showResult ? (
              <Card className="glass-strong">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-6">
                    <ScoreRing 
                      value={Math.round((score / quizQuestions.length) * 100)} 
                      size="xl"
                      label="Résultat"
                      sublabel={`${score}/${quizQuestions.length} correct${score > 1 ? 's' : ''}`}
                    />
                  </div>
                  <h3 className={cn(
                    "text-2xl font-bold mb-2",
                    score >= quizQuestions.length * 0.7 ? 'text-success' : 
                    score >= quizQuestions.length * 0.4 ? 'text-warning' : 'text-destructive'
                  )}>
                    {score >= quizQuestions.length * 0.7 ? '🎉 Excellent !' : 
                     score >= quizQuestions.length * 0.4 ? '👍 Bon travail !' : '💪 Continuez !'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Votre Growth Index a été mis à jour
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetQuiz} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Nouveau quiz
                    </Button>
                    <Button onClick={() => setActiveTab('reading')} className="gap-2">
                      Continuer à apprendre
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-strong overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/15 text-primary">
                        Question {currentQuestion + 1}/{quizQuestions.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {quizQuestions[currentQuestion]?.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="font-bold tabular-nums">{score}</span>
                    </div>
                  </div>
                  <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="h-1 mt-4" />
                </CardHeader>
                <CardContent className="py-8">
                  <h3 className="text-xl font-semibold mb-6 text-center">
                    {quizQuestions[currentQuestion]?.question}
                  </h3>
                  <div className="grid gap-3 max-w-2xl mx-auto">
                    {quizQuestions[currentQuestion]?.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === quizQuestions[currentQuestion].correct;
                      const showFeedback = selectedAnswer !== null;

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all border-2",
                            !showFeedback && "border-border/50 hover:border-primary/50 hover:bg-primary/5",
                            showFeedback && isCorrect && "border-success bg-success/10",
                            showFeedback && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            showFeedback && !isSelected && !isCorrect && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                              !showFeedback && "bg-muted",
                              showFeedback && isCorrect && "bg-success text-success-foreground",
                              showFeedback && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                            )}>
                              {showFeedback && isCorrect ? <CheckCircle2 className="h-5 w-5" /> :
                               showFeedback && isSelected ? <XCircle className="h-5 w-5" /> :
                               String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    Source: {quizQuestions[currentQuestion]?.source}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
