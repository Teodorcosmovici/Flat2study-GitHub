-- First convert all agency users to private users
UPDATE profiles SET user_type = 'private' WHERE user_type = 'agency';

-- Now we can safely apply the constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['student'::text, 'private'::text]));

-- Add listing review status for admin portal
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending_review';
ALTER TABLE listings ADD CONSTRAINT listings_review_status_check 
CHECK (review_status IN ('pending_review', 'approved', 'rejected'));

-- Add review fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_notes text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Add admin user type for reviewer accounts
ALTER TABLE profiles DROP CONSTRAINT profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['student'::text, 'private'::text, 'admin'::text]));

-- Create admin policy for listing review
DROP POLICY IF EXISTS "Admins can update listing review status" ON listings;
CREATE POLICY "Admins can update listing review status" 
ON listings FOR UPDATE
USING (get_user_profile_type() = 'admin')
WITH CHECK (get_user_profile_type() = 'admin');