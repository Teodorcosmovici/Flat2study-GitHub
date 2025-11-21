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
      toast.info('Starting Spacest web scraper...');

      // Call scraper edge function
      const { data, error } = await supabase.functions.invoke(
        'scrape-spacest-listings',
        {
          body: { 
            maxListings: 50,
            importToDb: true 
          },
        }
      );

      if (error) throw error;

      toast.success(
        `Scraping complete! ✅ Found: ${data.total_scraped}, 📥 Imported: ${data.imported_to_db}`
      );
      
      console.log('Scraper results:', data.results);
    } catch (error) {
      console.error('Scraping failed:', error);
      toast.error(`Scraping failed: ${error.message}`);
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
