-- Admin-only access for bookings to support cancellation processing in admin portal

-- Allow admins to view all bookings (drop existing policy first if it exists)
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (public.get_user_profile_type() = 'admin');

-- Allow admins to update any booking (e.g., mark as cancelled)
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
USING (public.get_user_profile_type() = 'admin')
WITH CHECK (public.get_user_profile_type() = 'admin');