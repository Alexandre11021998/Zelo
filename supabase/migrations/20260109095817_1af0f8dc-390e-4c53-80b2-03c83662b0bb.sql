-- 1. Criar tabela de hospitais
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar coluna hospital_id nas tabelas existentes
ALTER TABLE public.profiles ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);
ALTER TABLE public.patients ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- 3. Criar role superadmin no enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 4. Função para obter hospital_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid()
$$;