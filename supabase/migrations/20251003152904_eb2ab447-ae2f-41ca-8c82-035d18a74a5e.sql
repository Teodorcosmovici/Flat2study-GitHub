-- Update get_current_user_profile to be impersonation-aware
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles 
  WHERE user_id = public.get_effective_user_id() 
  LIMIT 1;
$$;