import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting image upload and replacement...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const listingId = formData.get('listing_id') as string;
    const userId = formData.get('user_id') as string;

    console.log(`Received request - Listing: ${listingId}, User: ${userId}, File: ${file?.name}`);

    if (!file || !listingId || !userId) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: file, listing_id, and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop() || 'jpg';
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `${Date.now()}-${random}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log(`Uploading file to storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filePath);

    const newImageUrl = urlData.publicUrl;
    console.log(`New image uploaded: ${newImageUrl}`);

    // Get current listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('images')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`Current images count: ${(listing.images as string[]).length}`);

    // Replace first image
    const currentImages = listing.images as string[];
    const updatedImages = [newImageUrl, ...currentImages.slice(1)];

    console.log('Updating listing with new images array...');

    // Update listing
    const { error: updateError } = await supabase
      .from('listings')
      .update({ images: updatedImages })
      .eq('id', listingId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Successfully updated listing image!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        newImageUrl,
        oldImageUrl: currentImages[0],
        message: 'First image updated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-listing-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
