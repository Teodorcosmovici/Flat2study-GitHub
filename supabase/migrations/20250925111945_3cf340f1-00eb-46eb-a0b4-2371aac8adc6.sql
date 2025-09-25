-- Add rental application fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN application_message TEXT,
ADD COLUMN application_document_url TEXT,
ADD COLUMN application_document_type TEXT;