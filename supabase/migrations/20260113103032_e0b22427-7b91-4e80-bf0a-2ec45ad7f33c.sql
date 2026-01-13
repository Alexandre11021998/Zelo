-- Update patients RLS policy to allow superadmins to see ALL patients
DROP POLICY IF EXISTS "Staff can view patients from their hospital" ON public.patients;

CREATE POLICY "Staff can view patients from their hospital"
ON public.patients
FOR SELECT
USING (
  -- Superadmins can see ALL patients
  has_role(auth.uid(), 'superadmin'::app_role)
  OR
  -- Admins can only see patients from their hospital
  (has_role(auth.uid(), 'admin'::app_role) AND hospital_id = get_user_hospital_id())
);