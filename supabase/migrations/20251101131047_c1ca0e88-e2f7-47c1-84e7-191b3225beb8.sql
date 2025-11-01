-- Add columns to support external listing imports
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS external_listing_id TEXT,
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_external_id_source 
ON listings(external_listing_id, external_source) 
WHERE external_listing_id IS NOT NULL AND external_source IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_external_source ON listings(external_source) 
WHERE external_source IS NOT NULL;