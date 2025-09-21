-- Phase 1: Update user types and remove agency system
-- Update user_type constraint to only allow 'student' and 'private' (landlords)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['student'::text, 'private'::text]));

-- Convert all existing agency users to private users (landlords)
UPDATE profiles SET user_type = 'private' WHERE user_type = 'agency';

-- Add listing review status for admin portal
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending_review' 
CHECK (review_status IN ('pending_review', 'approved', 'rejected'));

-- Add review notes for admin
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_notes text;

-- Add reviewed_at timestamp
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Add reviewed_by admin id
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Update RLS policies to replace agency with private landlords
DROP POLICY IF EXISTS "Agencies and private landlords can manage their own listings" ON listings;
DROP POLICY IF EXISTS "Agencies and private landlords can view their own archived list" ON archives;
DROP POLICY IF EXISTS "Agencies and private landlords can add to their own archives" ON archives;
DROP POLICY IF EXISTS "Agencies and private landlords can view their own credits" ON agency_credits;
DROP POLICY IF EXISTS "Agencies and private landlords can update their own credits" ON agency_credits;
DROP POLICY IF EXISTS "Agencies and private landlords can view their own transactions" ON credit_transactions;

-- Create new policies for private landlords only
CREATE POLICY "Private landlords can manage their own listings" 
ON listings FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = listings.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = listings.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

CREATE POLICY "Private landlords can view their own archived listings" 
ON archives FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = archives.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

CREATE POLICY "Private landlords can add to their own archives" 
ON archives FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = archives.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

CREATE POLICY "Private landlords can view their own credits" 
ON agency_credits FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = agency_credits.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

CREATE POLICY "Private landlords can update their own credits" 
ON agency_credits FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = agency_credits.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

CREATE POLICY "Private landlords can view their own transactions" 
ON credit_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = credit_transactions.agency_id 
  AND profiles.user_id = auth.uid() 
  AND profiles.user_type = 'private'
));

-- Update database functions to work with private landlords
CREATE OR REPLACE FUNCTION public.get_agency_business_info(agency_id_param uuid)
RETURNS TABLE(agency_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(p.full_name, 'Property Manager') as agency_name
  FROM profiles p
  WHERE p.id = agency_id_param
  AND p.user_type = 'private';
$function$;

-- Update trigger to only initialize credits for private landlords
CREATE OR REPLACE FUNCTION public.initialize_agency_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create credits for private landlords only
  IF NEW.user_type = 'private' THEN
    INSERT INTO public.agency_credits (agency_id, credits_balance)
    VALUES (NEW.id, 1) -- Give 1 free credit for first listing
    ON CONFLICT (agency_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Remove message-related policies and triggers since we're removing the messaging system
DROP POLICY IF EXISTS "Agencies and private landlords can view messages for their list" ON messages;
DROP POLICY IF EXISTS "Agencies and private landlords can update messages for their li" ON messages;
DROP POLICY IF EXISTS "Agencies and private landlords can send replies to their listin" ON messages;
DROP TRIGGER IF EXISTS after_message_insert ON messages;

-- Create admin policies for listing review
CREATE POLICY "Admins can update listing review status" 
ON listings FOR UPDATE
USING (get_user_profile_type() = 'admin')
WITH CHECK (get_user_profile_type() = 'admin');

-- Update the handle_new_user function to default to student instead of agency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_type_value text;
BEGIN
  -- Map user_type from user metadata to valid constraint values
  user_type_value := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'student');
  
  -- Ensure the user_type is one of the valid values (only student or private now)
  IF user_type_value NOT IN ('student', 'private') THEN
    user_type_value := 'student'; -- Default to student for invalid values
  END IF;

  INSERT INTO public.profiles (
    user_id, 
    user_type, 
    full_name, 
    email, 
    phone,
    university,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_type_value,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'university', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;