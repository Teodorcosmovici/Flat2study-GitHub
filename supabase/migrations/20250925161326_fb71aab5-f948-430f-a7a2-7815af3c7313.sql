-- Create admin impersonation sessions table
CREATE TABLE public.admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  impersonated_user_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  session_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  admin_ip_address inet,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all impersonation sessions" 
ON public.admin_impersonation_sessions 
FOR SELECT 
USING (get_user_profile_type() = 'admin');

CREATE POLICY "Admins can create impersonation sessions" 
ON public.admin_impersonation_sessions 
FOR INSERT 
WITH CHECK (
  get_user_profile_type() = 'admin' 
  AND admin_user_id = auth.uid()
);

CREATE POLICY "Admins can end their own impersonation sessions" 
ON public.admin_impersonation_sessions 
FOR UPDATE 
USING (
  get_user_profile_type() = 'admin' 
  AND admin_user_id = auth.uid()
  AND ended_at IS NULL
);

-- Function to start impersonation
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
  admin_profile_id uuid;
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

-- Function to end impersonation
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

-- Function to get current impersonation info
CREATE OR REPLACE FUNCTION public.get_current_impersonation()
RETURNS TABLE(
  session_token text,
  impersonated_user_id uuid,
  admin_user_id uuid,
  started_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;