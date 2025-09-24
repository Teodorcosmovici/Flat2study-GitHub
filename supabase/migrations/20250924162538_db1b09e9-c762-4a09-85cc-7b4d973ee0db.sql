-- Add payment authorization tracking fields to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_authorization_id text,
ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'cancelled', 'failed')),
ADD COLUMN authorization_expires_at timestamp with time zone,
ADD COLUMN landlord_response_due_at timestamp with time zone,
ADD COLUMN landlord_response text CHECK (landlord_response IN ('approved', 'declined'));

-- Function to automatically cancel expired authorizations
CREATE OR REPLACE FUNCTION handle_expired_authorizations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add booking request notifications tracking
CREATE TABLE IF NOT EXISTS booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  notification_type text NOT NULL CHECK (notification_type IN ('new_request', 'reminder_24h', 'reminder_12h', 'reminder_1h')),
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for booking notifications
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for landlords to view notifications for their bookings
CREATE POLICY "Landlords can view notifications for their bookings"
ON booking_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN profiles p ON b.landlord_id = p.id
    WHERE b.id = booking_notifications.booking_id
    AND p.user_id = auth.uid()
  )
);

-- Policy for system to insert notifications
CREATE POLICY "System can insert notifications"
ON booking_notifications FOR INSERT
WITH CHECK (true);