import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/useImpersonation";
import { Shield, LogOut } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonationSession, endImpersonation, loading } = useImpersonation();

  if (!isImpersonating || !impersonationSession) return null;

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
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