import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl text-yellow-600">Payment Canceled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Your payment was canceled</h3>
            <p className="text-muted-foreground">
              No charges were made to your card. You can try again or continue browsing properties.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your rental application was not submitted</li>
              <li>• You can return to complete the payment process</li>
              <li>• Your application details are saved if you return quickly</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Payment Again
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}