-- Update patients policies to allow colaboradores to manage patients from their hospital

-- First, drop the existing restrictive policies for staff
DROP POLICY IF EXISTS "Staff can view patients from their hospital" ON public.patients;
DROP POLICY IF EXISTS "Staff can insert patients in their hospital" ON public.patients;
DROP POLICY IF EXISTS "Staff can update patients in their hospital" ON public.patients;
DROP POLICY IF EXISTS "Staff can delete patients in their hospital" ON public.patients;

-- Create new PERMISSIVE policies that allow both admin AND colaborador roles

-- View policy: superadmins see all, admin and colaborador see their hospital's patients
CREATE POLICY "Staff can view patients from their hospital"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) 
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'colaborador'::app_role))
    AND hospital_id = get_user_hospital_id()
  )
);

-- Insert policy: admin and colaborador can insert patients in their hospital
CREATE POLICY "Staff can insert patients in their hospital"
ON public.patients
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'colaborador'::app_role))
  AND hospital_id = get_user_hospital_id()
);

-- Update policy: admin and colaborador can update patients in their hospital
CREATE POLICY "Staff can update patients in their hospital"
ON public.patients
FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'colaborador'::app_role))
  AND hospital_id = get_user_hospital_id()
);

-- Delete policy: only admin can delete patients in their hospital
CREATE POLICY "Staff can delete patients in their hospital"
ON public.patients
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND hospital_id = get_user_hospital_id()
);