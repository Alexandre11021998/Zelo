-- Drop the restrictive policy and recreate as permissive for public access
DROP POLICY IF EXISTS "Public can search patients by code and cpf" ON public.patients;

-- Create a permissive policy that allows anonymous users to search patients by code and cpf
CREATE POLICY "Public can search patients by code and cpf"
ON public.patients
FOR SELECT
TO anon
USING (
  codigo_paciente IS NOT NULL 
  AND cpf IS NOT NULL 
  AND is_active = true
);