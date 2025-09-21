-- Tighten storage policies to folder-per-user and ensure uploads work via userId prefix
ALTER POLICY "Authenticated users can upload listing images"
ON storage.objects
USING (true)
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

ALTER POLICY "Users can update their own listing images"
ON storage.objects
USING (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

ALTER POLICY "Users can delete their own listing images"
ON storage.objects
USING (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);