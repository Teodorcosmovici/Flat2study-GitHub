-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule import-spacest-listings to run every 30 minutes
SELECT cron.schedule(
  'import-spacest-listings-every-30min',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://txuptwgqziperdffnuqq.supabase.co/functions/v1/import-spacest-listings',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body:=jsonb_build_object('time', now()::text)
    ) as request_id;
  $$
);