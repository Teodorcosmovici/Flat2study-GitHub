-- Add missing fields to listings table for shared room properties and additional details
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS postcode text,
ADD COLUMN IF NOT EXISTS total_bedrooms integer,
ADD COLUMN IF NOT EXISTS total_bathrooms integer, 
ADD COLUMN IF NOT EXISTS housemates_gender text CHECK (housemates_gender IN ('male', 'female', 'mixed')),
ADD COLUMN IF NOT EXISTS house_rules jsonb DEFAULT '[]'::jsonb;