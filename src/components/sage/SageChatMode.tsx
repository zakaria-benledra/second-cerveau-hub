import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Sparkles, User, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { SuggestionFeedback } from '@/components/feedback/SuggestionFeedback';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showFeedback?: boolean;
}

export function SageChatMode() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sage-core', {
        body: {
          skill: 'chat',
          additionalContext: { 
            message: input, 
            history: messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
          },
        },
      });

      if (error) throw error;
      
      const response = data?.response?.micro_action?.message || 
                       data?.response?.observation || 
                       "Je suis là pour t'accompagner. Pose-moi une question !";
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response,
        showFeedback: true
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "Désolé, je rencontre une difficulté. Réessaie dans quelques instants." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="glass-strong h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Chat avec Sage</CardTitle>
            <CardDescription>Ton coach personnel IA</CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
            <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
            <p className="font-medium">Pose-moi une question sur tes objectifs,</p>
            <p>habitudes ou ta progression !</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
              {[
                "Comment progresser ?",
                "Analyse ma semaine",
                "Conseils pour demain"
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={msg.role === 'user' ? 'user-message' : 'sage-response'}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'assistant' 
                    ? "bg-gradient-to-br from-primary to-accent" 
                    : "bg-secondary"
                )}>
                  {msg.role === 'assistant' 
                    ? <Sparkles className="h-4 w-4 text-primary-foreground" /> 
                    : <User className="h-4 w-4" />
                  }
                </div>
                <div className="flex flex-col gap-1">
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary/50 rounded-bl-sm"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'assistant' && msg.showFeedback && (
                    <div className="ml-1">
                      <SuggestionFeedback
                        suggestionId={msg.id}
                        suggestionType="coach"
                        compact
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-secondary/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sage réfléchit...
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </ScrollArea>

      <CardContent className="border-t border-border/50 p-4 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            data-testid="send-message"
            disabled={isLoading || !input.trim()} 
            className="gradient-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
