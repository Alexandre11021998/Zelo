-- Drop the current public search policy
DROP POLICY IF EXISTS "Public can search patients by code and cpf" ON public.patients;

-- Create a new permissive policy for public search by name and birth date
CREATE POLICY "Public can search patients by name and birth date"
ON public.patients
FOR SELECT
TO anon
USING (
  is_active = true
);