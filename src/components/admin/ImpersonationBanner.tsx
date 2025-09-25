import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, LogOut, Clock } from "lucide-react";

interface ImpersonatedUser {
  full_name: string;
  email: string;
  user_type: string;
}

export function ImpersonationBanner() {
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkImpersonation = async () => {
      const impersonatedUserId = localStorage.getItem('impersonated_user_id');
      if (!impersonatedUserId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, user_type')
          .eq('user_id', impersonatedUserId)
          .single();

        if (error) throw error;
        setImpersonatedUser(data);
      } catch (error) {
        console.error('Error fetching impersonated user:', error);
      }
    };

    checkImpersonation();
  }, []);

  const endImpersonation = async () => {
    const token = localStorage.getItem('impersonation_token');
    if (!token) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('end_impersonation', { token });
      if (error) throw error;

      // Clear impersonation data
      localStorage.removeItem('impersonation_token');
      localStorage.removeItem('impersonated_user_id');
      localStorage.removeItem('original_admin_id');

      toast.success('Impersonation ended');
      
      // Reload to return to admin view
      window.location.reload();
    } catch (error: any) {
      console.error('Error ending impersonation:', error);
      toast.error(error.message || 'Failed to end impersonation');
    } finally {
      setLoading(false);
    }
  };

  if (!impersonatedUser) return null;

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>
            <strong>Admin Mode:</strong> You are impersonating{' '}
            <strong>{impersonatedUser.full_name || impersonatedUser.email}</strong>{' '}
            ({impersonatedUser.user_type})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={endImpersonation}
          disabled={loading}
          className="ml-4"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Exit
        </Button>
      </AlertDescription>
    </Alert>
  );
}