-- Add reminder_sent_at field to messages table to track when reminder emails were sent
ALTER TABLE public.messages ADD COLUMN reminder_sent_at timestamp with time zone;

-- Add index for efficient querying of unresponded messages
CREATE INDEX idx_messages_reminder_check ON public.messages(created_at, replied_at, reminder_sent_at) 
WHERE replied_at IS NULL AND reminder_sent_at IS NULL;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminder notification function to run every hour
-- This will check for messages older than 24 hours that haven't been replied to
SELECT cron.schedule(
  'send-reminder-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://txuptwgqziperdffnuqq.supabase.co/functions/v1/send-reminder-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXB0d2dxemlwZXJkZmZudXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE1MTA2NSwiZXhwIjoyMDcxNzI3MDY1fQ.YHBOjOSAcL-z1Wh6QH6RG8XxDnJ8mXKnJ8kJ8kJ8kJ8"}'::jsonb,
        body:='{"scheduled_check": true}'::jsonb
    ) as request_id;
  $$
);

-- Create function to mark messages as replied when agency responds
CREATE OR REPLACE FUNCTION public.mark_message_as_replied()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a message from an agency/private user
  IF EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = NEW.sender_id 
    AND p.user_type IN ('agency', 'private')
  ) THEN
    -- Mark the original student message(s) in this conversation as replied
    UPDATE public.messages 
    SET replied_at = NOW()
    WHERE listing_id = NEW.listing_id
    AND conversation_id = NEW.conversation_id
    AND sender_id != NEW.sender_id
    AND replied_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically mark messages as replied
CREATE TRIGGER trigger_mark_message_as_replied
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_message_as_replied();