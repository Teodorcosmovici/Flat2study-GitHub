-- First, set default values for existing null phone numbers and emails
UPDATE profiles 
SET phone = 'Not provided' 
WHERE phone IS NULL;

UPDATE profiles 
SET email = COALESCE(email, 'noemail@placeholder.com')
WHERE email IS NULL;

-- Now make email and phone mandatory
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone SET NOT NULL;

-- Add constraint to ensure email is valid format (allowing placeholder)
ALTER TABLE profiles 
ADD CONSTRAINT valid_email CHECK (
  email = 'noemail@placeholder.com' OR 
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Add constraint to ensure phone is not empty
ALTER TABLE profiles 
ADD CONSTRAINT valid_phone CHECK (length(trim(phone)) > 0);