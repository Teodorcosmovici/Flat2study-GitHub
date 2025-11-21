import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

export const FeedImportButton = () => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Fetch the Spacest JSON feed
      const feedUrl = 'https://roomless-file.s3.us-east-2.amazonaws.com/feed-partner/example_feed.json';
      const response = await fetch(feedUrl);
      const rawListings = await response.json();

      // Map Spacest feed format to expected format
      const mappedListings = rawListings.map((listing: any) => ({
        code: String(listing.listing_code),
        title: listing.name,
        description: listing.description,
        address: listing.location?.address,
        city: listing.location?.city,
        province: listing.location?.province,
        region: listing.location?.region,
        country: listing.location?.country,
        lat: listing.location?.coordinates?.latitude,
        lng: listing.location?.coordinates?.longitude,
        price: listing.price,
        deposit: listing.surcharges?.find((s: any) => s.type === 'security_deposit')?.deposit,
        category: listing.category,
        bedrooms: listing.house_informations?.bedrooms,
        bathrooms: listing.house_informations?.bathrooms,
        size: listing.house_informations?.size,
        furnished: listing.amenities?.includes('Furnished'),
        bills_included: listing.utilities?.included_in_rent?.length > 0,
        images: listing.photos?.map((p: any) => p.url) || [],
        amenities: listing.amenities || [],
        availability_date: listing.first_availability,
      }));

      toast.info(`Starting import of ${mappedListings.length} listings from Spacest feed...`);

      // Call feed import edge function
      const { data, error } = await supabase.functions.invoke(
        'import-spacest-feed-direct',
        {
          body: { listings: mappedListings },
        }
      );

      if (error) throw error;

      toast.success(
        `Import complete! ✅ Imported: ${data.imported}, 🔄 Updated: ${data.updated}, 🗑️ Removed: ${data.removed}, ⏭️ Skipped: ${data.skipped}`
      );
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isImporting}
      className="gap-2"
    >
      {isImporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Importing...
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Import Spacest Feed
        </>
      )}
    </Button>
  );
};
