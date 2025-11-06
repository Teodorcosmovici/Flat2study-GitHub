import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export const CleanupSpacestButton = () => {
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      toast.info('Starting cleanup of invalid Spacest listings...');

      const { data, error } = await supabase.functions.invoke(
        'cleanup-invalid-spacest-listings'
      );

      if (error) throw error;

      toast.success(
        `Cleanup complete! 🗑️ Removed: ${data.totalDeleted} listings`
      );
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Button
      onClick={handleCleanup}
      disabled={isCleaning}
      variant="destructive"
      className="gap-2"
    >
      {isCleaning ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Cleaning up...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Delete All Spacest (Keep €1900)
        </>
      )}
    </Button>
  );
};
