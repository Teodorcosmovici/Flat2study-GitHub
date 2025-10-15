-- Allow anonymous users to send messages to listings
-- This enables the "Ask for more information" feature to work without authentication
CREATE POLICY "Anonymous users can send inquiry messages to listings"
ON public.messages
FOR INSERT
TO anon
WITH CHECK (
  -- Must be for a published listing
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = messages.listing_id
    AND listings.status = 'PUBLISHED'
  )
  -- sender_id must be null for anonymous users
  AND sender_id IS NULL
  -- Must provide contact information
  AND sender_name IS NOT NULL
  AND sender_phone IS NOT NULL
);