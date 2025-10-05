-- Fix impersonation functions - drop and recreate to avoid parameter name conflicts

-- Drop existing functions
DROP FUNCTION IF EXISTS public.end_impersonation(text);
DROP FUNCTION IF EXISTS public.start_impersonation(uuid, text);
DROP FUNCTION IF EXISTS public.get_current_impersonation();

-- 1) Recreate get_current_impersonation with fully qualified columns
CREATE FUNCTION public.get_current_impersonation()
RETURNS TABLE(
  session_token text,
  impersonated_user_id uuid,
  admin_user_id uuid,
  started_at timestamptz
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
  FROM public.admin_impersonation_sessions AS ais
  WHERE ais.admin_user_id = auth.uid()
    AND ais.ended_at IS NULL
  ORDER BY ais.started_at DESC
  LIMIT 1;
END;
$$;

-- 2) Recreate end_impersonation with distinct parameter name
CREATE FUNCTION public.end_impersonation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_impersonation_sessions AS ais
  SET ended_at = now()
  WHERE ais.session_token = p_token
    AND ais.admin_user_id = auth.uid()
    AND ais.ended_at IS NULL;
  RETURN FOUND;
END;
$$;

-- 3) Recreate start_impersonation with distinct variable names
CREATE FUNCTION public.start_impersonation(target_user_id uuid, reason_text text DEFAULT 'Support assistance')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token text;
  v_target_profile jsonb;
BEGIN
  -- Only admins can impersonate
  IF public.get_user_profile_type() <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can impersonate users';
  END IF;

  -- Validate target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- End any active sessions for this admin
  UPDATE public.admin_impersonation_sessions AS ais
  SET ended_at = now()
  WHERE ais.admin_user_id = auth.uid()
    AND ais.ended_at IS NULL;

  -- Create new impersonation session
  INSERT INTO public.admin_impersonation_sessions (
    admin_user_id,
    impersonated_user_id,
    reason,
    admin_ip_address
  ) VALUES (
    auth.uid(),
    target_user_id,
    reason_text,
    inet_client_addr()
  ) RETURNING session_token INTO v_session_token;

  -- Get target user profile
  SELECT jsonb_build_object(
    'full_name', p.full_name,
    'email', p.email,
    'user_type', p.user_type
  ) INTO v_target_profile
  FROM public.profiles p
  WHERE p.user_id = target_user_id
  LIMIT 1;

  -- Return session data
  RETURN jsonb_build_object(
    'session_token', v_session_token,
    'impersonated_user_id', target_user_id,
    'admin_user_id', auth.uid(),
    'started_at', now(),
    'target_user', COALESCE(v_target_profile, '{}'::jsonb)
  );
END;
$$;