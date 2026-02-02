-- Migration: Fix subscription trigger to be fault-tolerant
-- Problem: Trigger blocks auth signup when it fails

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a separate transaction block to prevent auth rollback
  BEGIN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth transaction
    RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- Ensure insert policies for system operations
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "System can insert subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Similarly fix the user profile trigger to be fault-tolerant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;