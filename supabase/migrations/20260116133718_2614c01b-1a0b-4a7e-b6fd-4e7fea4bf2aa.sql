-- Add cpf and codigo_paciente columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS codigo_paciente text;

-- Create unique index on codigo_paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_codigo_paciente ON public.patients (codigo_paciente) WHERE codigo_paciente IS NOT NULL;

-- Create index on cpf for faster lookups (not unique as same person might be admitted multiple times)
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients (cpf);

-- Create a function to generate unique patient code
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    -- Generate code like PAC + 5 random alphanumeric characters
    new_code := 'PAC' || upper(substr(md5(random()::text), 1, 5));
    SELECT EXISTS(SELECT 1 FROM public.patients WHERE codigo_paciente = new_code) INTO code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Create trigger to auto-generate codigo_paciente on insert
CREATE OR REPLACE FUNCTION public.set_patient_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_paciente IS NULL THEN
    NEW.codigo_paciente := generate_patient_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_patient_code ON public.patients;
CREATE TRIGGER trigger_set_patient_code
BEFORE INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.set_patient_code();

-- Generate codes for existing patients that don't have one
UPDATE public.patients 
SET codigo_paciente = generate_patient_code() 
WHERE codigo_paciente IS NULL;

-- Create RLS policy to allow public read access for companion search by codigo_paciente and cpf
CREATE POLICY "Public can search patients by code and cpf"
ON public.patients
FOR SELECT
TO anon
USING (
  codigo_paciente IS NOT NULL 
  AND cpf IS NOT NULL 
  AND is_active = true
);