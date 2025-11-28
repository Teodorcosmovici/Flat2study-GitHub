import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

export const Flat2StudyImportButton = () => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      toast.info('Starting Flat2Study feed import...');

      const { data, error } = await supabase.functions.invoke(
        'import-flat2study-feed',
        { body: {} }
      );

      if (error) throw error;

      toast.success(
        `Import complete! ✅ Imported: ${data.imported}, 🔄 Updated: ${data.updated}, ⏭️ Skipped: ${data.skipped} (Total: ${data.total})`
      );
      
      if (data.errors && data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }
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
          Import Flat2Study Feed
        </>
      )}
    </Button>
  );
};
