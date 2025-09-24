import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    const createBooking = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-booking-from-checkout', {
          body: { sessionId }
        });

        if (error) {
          throw error;
        }

        setBookingData(data);
        toast.success('Payment authorized and application submitted!');
      } catch (err) {
        console.error('Error creating booking:', err);
        setError(err.message || 'Failed to process booking');
        toast.error('Failed to process booking');
      } finally {
        setLoading(false);
      }
    };

    createBooking();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Payment Authorized!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your payment has been authorized and your rental application has been submitted.
            </p>
            <p className="text-sm text-muted-foreground">
              The landlord will review your application and respond within 24 hours. 
              You will only be charged if your application is approved.
            </p>
          </div>

          {bookingData?.booking && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-medium mb-2">Application Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Booking ID:</span>
                  <span className="font-mono text-xs">{bookingData.booking.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{new Date(bookingData.booking.check_in_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{new Date(bookingData.booking.check_out_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Authorized:</span>
                  <span>€{bookingData.booking.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-yellow-600 font-medium">Pending Landlord Response</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={() => navigate('/my-bookings')} className="w-full">
              View My Applications
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Continue Browsing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}