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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const listingId = formData.get('listing_id') as string;
    const userId = formData.get('user_id') as string;

    if (!file || !listingId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop() || 'jpg';
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `${Date.now()}-${random}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
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
      .eq('id', listingId)
      .single();

    if (fetchError) throw fetchError;

    // Replace first image
    const currentImages = listing.images as string[];
    const updatedImages = [newImageUrl, ...currentImages.slice(1)];

    // Update listing
    const { error: updateError } = await supabase
      .from('listings')
      .update({ images: updatedImages })
      .eq('id', listingId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        newImageUrl,
        message: 'First image updated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
