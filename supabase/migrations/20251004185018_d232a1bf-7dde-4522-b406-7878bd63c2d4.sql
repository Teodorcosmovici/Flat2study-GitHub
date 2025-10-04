-- Fix ambiguous column reference in get_current_impersonation
DROP FUNCTION IF EXISTS public.get_current_impersonation();

CREATE OR REPLACE FUNCTION public.get_current_impersonation()
RETURNS TABLE(
  session_token text,
  impersonated_user_id uuid,
  admin_user_id uuid,
  started_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ais.session_token,
    ais.impersonated_user_id,
    ais.admin_user_id,
    ais.started_at
  FROM admin_impersonation_sessions ais
  WHERE ais.admin_user_id = auth.uid()
  AND ais.ended_at IS NULL
  ORDER BY ais.started_at DESC
  LIMIT 1;
END;
$$;