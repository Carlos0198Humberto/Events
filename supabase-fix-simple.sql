DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE POLICY "select_own_profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "update_own_profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
