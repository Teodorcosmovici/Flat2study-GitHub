import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlatformCommunicationNoticeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const PlatformCommunicationNotice: React.FC<PlatformCommunicationNoticeProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const { t } = useLanguage();
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded ${className}`}>
        <Shield className="h-3 w-3" />
        <span>{t('platform.communication.compact')}</span>
      </div>
    );
  }

  return (
    <Alert className={className}>
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span>
          <strong>{t('platform.communication.policy')}</strong> {t('platform.communication.message')}
        </span>
      </AlertDescription>
    </Alert>
  );
};