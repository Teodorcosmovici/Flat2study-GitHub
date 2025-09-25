import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-orange-700">{t('checkout.cancelled.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {t('checkout.cancelled.message')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('checkout.cancelled.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate(-1)} className="w-full">
              {t('checkout.cancelled.tryAgain')}
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              {t('checkout.cancelled.browseProperties')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}