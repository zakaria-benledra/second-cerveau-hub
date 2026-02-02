-- Migration: Fix gamification trigger to be fault-tolerant
-- Problem: Trigger blocks auth signup when it fails

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS on_user_created_gamification ON auth.users;

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION public.create_gamification_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a separate transaction block to prevent auth rollback
  BEGIN
    INSERT INTO public.gamification_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth transaction
    RAISE WARNING 'Failed to create gamification profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_gamification_profile();

-- Ensure the insert policy allows the security definer function
DROP POLICY IF EXISTS "System can insert gamification" ON public.gamification_profiles;
CREATE POLICY "System can insert gamification" ON public.gamification_profiles
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Also allow service_role full access
DROP POLICY IF EXISTS "Service role full access gamification" ON public.gamification_profiles;
CREATE POLICY "Service role full access gamification" ON public.gamification_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);