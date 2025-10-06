-- Drop the existing RLS policy for agencies and private landlords
DROP POLICY IF EXISTS "Agencies and private landlords can manage their own listings" ON listings;

-- Create updated RLS policy that works with impersonation
CREATE POLICY "Agencies and private landlords can manage their own listings"
ON listings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = listings.agency_id
    AND profiles.user_id = get_effective_user_id()
    AND profiles.user_type IN ('agency', 'AGENCY', 'private', 'PRIVATE')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = listings.agency_id
    AND profiles.user_id = get_effective_user_id()
    AND profiles.user_type IN ('agency', 'AGENCY', 'private', 'PRIVATE')
  )
);