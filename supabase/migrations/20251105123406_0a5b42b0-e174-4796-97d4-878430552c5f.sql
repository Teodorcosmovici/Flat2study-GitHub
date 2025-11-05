-- Allow admins to view all listings (needed for impersonation)
CREATE POLICY "Admins can view all listings for editing"
ON public.listings
FOR SELECT
TO authenticated
USING (
  (SELECT user_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);