-- Add is_active column to patients table
ALTER TABLE public.patients 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance on filtered queries
CREATE INDEX idx_patients_is_active ON public.patients(is_active);