-- Rendre why_this_practice nullable pour éviter les erreurs
ALTER TABLE public.program_elements_wiki 
ALTER COLUMN why_this_practice DROP NOT NULL;

-- Ajouter une valeur par défaut
ALTER TABLE public.program_elements_wiki 
ALTER COLUMN why_this_practice SET DEFAULT '';