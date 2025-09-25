-- Create a table to store cancellation requests
CREATE TABLE public.cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on cancellation requests
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for cancellation requests
CREATE POLICY "Tenants can create cancellation requests" ON public.cancellation_requests
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can view their own cancellation requests" ON public.cancellation_requests
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Admins can view all cancellation requests" ON public.cancellation_requests
  FOR SELECT USING (get_user_profile_type() = 'admin');

CREATE POLICY "Admins can update cancellation requests" ON public.cancellation_requests
  FOR UPDATE USING (get_user_profile_type() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_cancellation_requests_updated_at
  BEFORE UPDATE ON public.cancellation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();