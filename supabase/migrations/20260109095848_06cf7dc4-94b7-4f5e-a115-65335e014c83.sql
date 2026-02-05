-- Políticas para hospitals
CREATE POLICY "Superadmins can manage hospitals"
ON public.hospitals
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can view own hospital"
ON public.hospitals
FOR SELECT
USING (id = public.get_user_hospital_id());

-- Atualizar políticas de patients para incluir hospital_id
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Anyone can view patient by CPF" ON public.patients;

CREATE POLICY "Staff can view patients from their hospital"
ON public.patients
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'admin') AND hospital_id = public.get_user_hospital_id())
  OR (is_active = true AND hospital_id IS NOT NULL)
);

CREATE POLICY "Staff can insert patients in their hospital"
ON public.patients
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND hospital_id = public.get_user_hospital_id()
);

CREATE POLICY "Staff can update patients in their hospital"
ON public.patients
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') 
  AND hospital_id = public.get_user_hospital_id()
);

CREATE POLICY "Staff can delete patients in their hospital"
ON public.patients
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') 
  AND hospital_id = public.get_user_hospital_id()
);

-- Atualizar políticas de profiles para incluir hospital_id
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Staff can view profiles from their hospital"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR (public.has_role(auth.uid(), 'admin') AND hospital_id = public.get_user_hospital_id())
  OR public.has_role(auth.uid(), 'superadmin')
);