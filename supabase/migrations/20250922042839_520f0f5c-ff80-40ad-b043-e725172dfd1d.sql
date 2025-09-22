-- Create storage policies for listing-images bucket
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own listing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all listing images (public access)
CREATE POLICY "Anyone can view listing images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own listing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own listing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);