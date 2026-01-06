-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN cpf TEXT,
ADD COLUMN registration_number TEXT,
ADD COLUMN job_role TEXT;

-- Add tracking columns to patients table
ALTER TABLE public.patients
ADD COLUMN updated_by UUID REFERENCES public.profiles(id),
ADD COLUMN updated_by_name TEXT;

-- Update handle_new_user function to save additional fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, cpf, registration_number, job_role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'cpf',
    NEW.raw_user_meta_data ->> 'registration_number',
    NEW.raw_user_meta_data ->> 'job_role'
  );
  RETURN NEW;
END;
$$;