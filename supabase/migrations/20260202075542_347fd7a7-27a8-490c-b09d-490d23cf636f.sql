-- Add optional demographic columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));