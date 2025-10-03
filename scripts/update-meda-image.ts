import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = "https://txuptwgqziperdffnuqq.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateMedaImage() {
  try {
    // Read the image file
    const imagePath = path.join(process.cwd(), 'public/images/meda-36-room-1.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Upload to Supabase storage
    const userId = '18a15bf3-f745-40ca-b418-c38ddf59fb45'; // From the existing images
    const fileName = `${Date.now()}-meda-room-1.jpg`;
    const filePath = `${userId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filePath);
    
    const newImageUrl = urlData.publicUrl;
    
    // Get current listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('images')
      .eq('id', '8ab090d6-8d65-4c25-b83c-9c3bc06b7806')
      .single();
    
    if (fetchError) throw fetchError;
    
    // Replace first image
    const currentImages = listing.images as string[];
    const updatedImages = [newImageUrl, ...currentImages.slice(1)];
    
    // Update listing
    const { error: updateError } = await supabase
      .from('listings')
      .update({ images: updatedImages })
      .eq('id', '8ab090d6-8d65-4c25-b83c-9c3bc06b7806');
    
    if (updateError) throw updateError;
    
    console.log('Successfully updated the first image!');
    console.log('New image URL:', newImageUrl);
    
  } catch (error) {
    console.error('Error updating image:', error);
  }
}

updateMedaImage();
