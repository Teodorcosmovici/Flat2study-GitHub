-- Update the current user to be an admin so they can access cancellation requests
UPDATE profiles 
SET user_type = 'admin', updated_at = now()
WHERE user_id = '4cfed418-9cba-4eef-95eb-582215ab394d';