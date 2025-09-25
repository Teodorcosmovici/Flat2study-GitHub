-- Fix the function search path security warning by ensuring all functions have proper search_path set
CREATE OR REPLACE FUNCTION public.start_impersonation(
  target_user_id uuid,
  reason_text text DEFAULT 'Support assistance'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token text;
BEGIN
  -- Check if user is admin
  IF get_user_profile_type() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can impersonate users';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- End any existing active impersonation sessions for this admin
  UPDATE admin_impersonation_sessions 
  SET ended_at = now() 
  WHERE admin_user_id = auth.uid() 
  AND ended_at IS NULL;
  
  -- Create new session
  INSERT INTO admin_impersonation_sessions (
    admin_user_id,
    impersonated_user_id,
    reason,
    admin_ip_address
  ) VALUES (
    auth.uid(),
    target_user_id,
    reason_text,
    inet_client_addr()
  ) RETURNING session_token INTO session_token;
  
  RETURN session_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_impersonation(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_impersonation_sessions 
  SET ended_at = now() 
  WHERE session_token = token 
  AND admin_user_id = auth.uid() 
  AND ended_at IS NULL;
  
  RETURN FOUND;
END;
$$;