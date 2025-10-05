import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/useImpersonation";
import { Shield, LogOut } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonationSession, endImpersonation, loading } = useImpersonation();

  if (!isImpersonating || !impersonationSession) return null;

  return (
    <Alert role="status" className="fixed top-0 left-0 right-0 z-[60] border-warning bg-warning/10 backdrop-blur supports-[backdrop-filter]:bg-warning/20 rounded-none border-b">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>
            <strong>Admin Mode:</strong> You are currently impersonating a user.{' '}
            Started at {new Date(impersonationSession.started_at).toLocaleString()}
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
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
}