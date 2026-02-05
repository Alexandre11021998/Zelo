-- Drop existing RESTRICTIVE policies on user_roles
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Drop existing RESTRICTIVE policies on profiles
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles from their hospital" ON public.profiles;

-- Create PERMISSIVE policies for user_roles
-- Allow anyone to insert roles (needed for signup flow - trigger will handle this)
CREATE POLICY "Allow system insert roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins and superadmins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create PERMISSIVE policies for profiles
-- Allow anyone to insert profiles (needed for signup trigger)
CREATE POLICY "Allow system insert profiles"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins and superadmins to view profiles from their hospital
CREATE POLICY "Staff can view hospital profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) 
  OR (has_role(auth.uid(), 'admin'::app_role) AND hospital_id = get_user_hospital_id())
);

-- Allow admins to update profiles in their hospital
CREATE POLICY "Admins can update hospital profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) 
  OR (has_role(auth.uid(), 'admin'::app_role) AND hospital_id = get_user_hospital_id())
);