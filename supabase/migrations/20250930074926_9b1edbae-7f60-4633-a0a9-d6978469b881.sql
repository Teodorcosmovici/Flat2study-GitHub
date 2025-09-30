-- Drop and recreate the RLS policy for viewing application documents to fix landlord access
DROP POLICY IF EXISTS "Users and landlords can view application documents" ON storage.objects;

-- Create improved policy for viewing application documents
CREATE POLICY "Users and landlords can view application documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'applications' 
  AND (
    -- Document owner can view their own documents
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Landlords can view documents for bookings on their properties
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN profiles p ON b.landlord_id = p.id
      WHERE b.application_document_url = name
      AND p.user_id = auth.uid()
    )
    OR
    -- Admins can view all documents
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.user_type = 'admin'
    )
  )
);