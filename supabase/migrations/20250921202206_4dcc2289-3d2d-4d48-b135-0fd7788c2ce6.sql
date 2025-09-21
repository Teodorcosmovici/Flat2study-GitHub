-- Create listing-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for listing-images bucket
CREATE POLICY "Anyone can view listing images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listing images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own listing images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');