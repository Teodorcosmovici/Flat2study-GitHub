-- Drop and recreate the start_impersonation function with new return type
DROP FUNCTION IF EXISTS public.start_impersonation(uuid, text);

-- Create function to get the effective user ID (considering impersonation)
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  impersonated_id uuid;
BEGIN
  -- Get the actual authenticated user
  current_user_id := auth.uid();
  
  -- Check if this admin user has an active impersonation session
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = current_user_id 
    AND user_type = 'admin'
  ) THEN
    -- Get the impersonated user ID if there's an active session
    SELECT impersonated_user_id INTO impersonated_id
    FROM admin_impersonation_sessions
    WHERE admin_user_id = current_user_id
    AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1;
    
    -- Return impersonated user ID if found, otherwise return actual user ID
    IF impersonated_id IS NOT NULL THEN
      RETURN impersonated_id;
    END IF;
  END IF;
  
  -- Return the actual authenticated user ID
  RETURN current_user_id;
END;
$$;

-- Recreate start_impersonation function to return full session data
CREATE OR REPLACE FUNCTION public.start_impersonation(target_user_id uuid, reason_text text DEFAULT 'Support assistance')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token text;
  session_data jsonb;
  target_profile jsonb;
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
  
  -- Create new session and get the token
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
  
  -- Get target user profile info
  SELECT jsonb_build_object(
    'full_name', full_name,
    'email', email,
    'user_type', user_type
  ) INTO target_profile
  FROM profiles
  WHERE user_id = target_user_id;
  
  -- Build response
  session_data := jsonb_build_object(
    'session_token', session_token,
    'impersonated_user_id', target_user_id,
    'admin_user_id', auth.uid(),
    'started_at', now(),
    'target_user', target_profile
  );
  
  RETURN session_data;
END;
$$;