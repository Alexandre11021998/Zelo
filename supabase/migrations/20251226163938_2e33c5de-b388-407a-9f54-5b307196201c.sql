-- Add data_nascimento column to patients table
ALTER TABLE public.patients ADD COLUMN data_nascimento DATE NOT NULL DEFAULT '2000-01-01';

-- Remove the default after adding (it was just to allow migration with existing data)
ALTER TABLE public.patients ALTER COLUMN data_nascimento DROP DEFAULT;