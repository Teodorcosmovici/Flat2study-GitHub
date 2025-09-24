-- Fix the function search path issue for handle_expired_authorizations
CREATE OR REPLACE FUNCTION handle_expired_authorizations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This will be called by a cron job or background task
  UPDATE bookings 
  SET status = 'cancelled',
      payment_status = 'expired'
  WHERE payment_status = 'authorized' 
    AND landlord_response_due_at < now()
    AND landlord_response IS NULL;
END;
$$;