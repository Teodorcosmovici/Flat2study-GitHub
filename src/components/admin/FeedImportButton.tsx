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
      const listings = await response.json();

      toast.info(`Starting import of ${listings.length} listings from Spacest feed...`);

      // Call feed import edge function
      const { data, error } = await supabase.functions.invoke(
        'import-spacest-feed-direct',
        {
          body: { listings },
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
