-- Drop existing restrictive policies
DROP POLICY "Agencies can upload listing images" ON storage.objects;
DROP POLICY "Agencies can update their listing images" ON storage.objects;
DROP POLICY "Agencies can delete their listing images" ON storage.objects;

-- Create new policies that allow both agencies and private landlords
CREATE POLICY "Authenticated users can upload listing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own listing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own listing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);