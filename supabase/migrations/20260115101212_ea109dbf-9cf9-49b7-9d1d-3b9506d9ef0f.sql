-- Add unique hospital code for staff self-registration
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS codigo_acesso VARCHAR(8) UNIQUE;

-- Generate unique codes for existing hospitals
UPDATE public.hospitals 
SET codigo_acesso = UPPER(SUBSTR(MD5(id::text || NOW()::text), 1, 6))
WHERE codigo_acesso IS NULL;

-- Make the column NOT NULL after populating
ALTER TABLE public.hospitals ALTER COLUMN codigo_acesso SET NOT NULL;

-- Add 'colaborador' role to app_role enum for regular staff (not managers)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'colaborador';