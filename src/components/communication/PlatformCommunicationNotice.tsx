import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, MessageCircle } from 'lucide-react';

interface PlatformCommunicationNoticeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const PlatformCommunicationNotice: React.FC<PlatformCommunicationNoticeProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded ${className}`}>
        <Shield className="h-3 w-3" />
        <span>For your safety, all communications must happen through our platform</span>
      </div>
    );
  }

  return (
    <Alert className={className}>
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span>
          <strong>Platform Communication Policy:</strong> For your safety and security, 
          all communications between tenants and landlords must happen through our platform. 
          Contact information is protected and blurred for privacy.
        </span>
      </AlertDescription>
    </Alert>
  );
};