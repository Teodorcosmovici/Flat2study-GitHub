-- Create contact access requests table
CREATE TABLE public.contact_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(requester_id, target_profile_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.contact_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for contact access requests
CREATE POLICY "Users can view their own requests" 
ON public.contact_access_requests 
FOR SELECT 
USING (requester_id = auth.uid());

CREATE POLICY "Users can create contact access requests" 
ON public.contact_access_requests 
FOR INSERT 
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Profile owners can view requests for their contact info" 
ON public.contact_access_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = contact_access_requests.target_profile_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Profile owners can update requests for their contact info" 
ON public.contact_access_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = contact_access_requests.target_profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Function to check if user has access to contact info
CREATE OR REPLACE FUNCTION public.has_contact_access(requester_user_id UUID, target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_access_requests
    WHERE requester_id = requester_user_id
    AND target_profile_id = target_profile_id
    AND status = 'approved'
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Update trigger for contact access requests
CREATE TRIGGER update_contact_access_requests_updated_at
BEFORE UPDATE ON public.contact_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();