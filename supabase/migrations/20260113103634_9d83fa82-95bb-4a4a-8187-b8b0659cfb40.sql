-- Add new columns to hospitals table
ALTER TABLE public.hospitals
ADD COLUMN IF NOT EXISTS razao_social text,
ADD COLUMN IF NOT EXISTS email_contato text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS uf text,
ADD COLUMN IF NOT EXISTS nome_gestor text,
ADD COLUMN IF NOT EXISTS dados_faturamento text,
ADD COLUMN IF NOT EXISTS logo_url text;