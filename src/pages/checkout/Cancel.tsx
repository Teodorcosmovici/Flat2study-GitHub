import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-orange-700">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your payment was cancelled. No charges have been made to your card.
            </p>
            <p className="text-sm text-muted-foreground">
              You can try again or continue browsing other properties.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate(-1)} className="w-full">
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Browse Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}