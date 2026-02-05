-- Create storage bucket for document photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true);

-- Allow public uploads to the documentos bucket
CREATE POLICY "Anyone can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Allow public read access to documents
CREATE POLICY "Anyone can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos');

-- Create pre_checkin table
CREATE TABLE public.pre_checkin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  convenio TEXT NOT NULL,
  documento_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pre_checkin ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public check-in form)
CREATE POLICY "Anyone can create pre_checkin"
ON public.pre_checkin
FOR INSERT
WITH CHECK (true);

-- Allow admins to view all pre_checkins
CREATE POLICY "Admins can view pre_checkins"
ON public.pre_checkin
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update pre_checkins
CREATE POLICY "Admins can update pre_checkins"
ON public.pre_checkin
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));