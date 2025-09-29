-- Update the listings table type constraint to include 'bedspace'
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_type_check;

ALTER TABLE public.listings 
ADD CONSTRAINT listings_type_check 
CHECK (type IN ('entire_property', 'studio', 'room_shared', 'bedspace_shared', 'apartment', 'room', 'bedspace'));