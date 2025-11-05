-- Allow admins to update all listings
CREATE POLICY "Admins can update all listings"
ON public.listings
FOR UPDATE
TO authenticated
USING (
  (SELECT user_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT user_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);