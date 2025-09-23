import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Call the verify-rental-payment edge function
        const { data, error } = await supabase.functions.invoke('verify-rental-payment', {
          body: { sessionId }
        });

        if (error) {
          console.error('Error verifying payment:', error);
          setError('Failed to verify payment');
          return;
        }

        if (data?.success) {
          setBookingData(data.booking);
          toast.success('Payment confirmed! Your rental application has been submitted.');
        } else {
          setError('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment and create your booking.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Error</h2>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Your rental application has been submitted</h3>
            <p className="text-muted-foreground">
              The landlord has been notified and will review your application. You'll receive updates via email.
            </p>
          </div>

          {bookingData && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Booking Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Booking ID:</span>
                  <span className="font-mono">{bookingData.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{new Date(bookingData.check_in_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{new Date(bookingData.check_out_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>€{bookingData.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize text-green-600">{bookingData.status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={() => navigate('/my-bookings')} className="w-full">
              View My Bookings
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}