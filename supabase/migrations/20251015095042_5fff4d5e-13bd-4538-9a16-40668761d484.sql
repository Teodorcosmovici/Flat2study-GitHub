-- Allow anonymous inquiries by making sender_id optional
ALTER TABLE public.messages
ALTER COLUMN sender_id DROP NOT NULL;