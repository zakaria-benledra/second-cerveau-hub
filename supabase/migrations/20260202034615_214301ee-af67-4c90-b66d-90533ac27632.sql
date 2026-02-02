-- Create the missing gamification_profiles table
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own gamification profile" 
ON public.gamification_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own gamification profile" 
ON public.gamification_profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "System can insert gamification profiles" 
ON public.gamification_profiles 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_gamification_profiles_updated_at
BEFORE UPDATE ON public.gamification_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();