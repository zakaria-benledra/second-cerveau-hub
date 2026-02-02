-- Trigger pour créer rôle membre par défaut
CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Role creation failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_created_default_role ON auth.users;
CREATE TRIGGER on_user_created_default_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_role();

-- Assigner rôle aux utilisateurs existants sans rôle
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'member'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT DO NOTHING;