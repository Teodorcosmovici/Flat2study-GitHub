-- Add listing_id to support_messages table
ALTER TABLE public.support_messages 
ADD COLUMN listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;