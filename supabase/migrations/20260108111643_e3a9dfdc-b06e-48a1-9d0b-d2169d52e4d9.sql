-- Add UNIQUE constraint to cpf column in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);