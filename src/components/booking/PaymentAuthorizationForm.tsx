import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Loader2, Clock, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const stripePromise = loadStripe('pk_live_51S8dZERKknisFEsRSdE0kD4yldWOHUEP0Y16ANZu8Zm3GABjxcZvioxUjrp5WMZ7gye88V2aU13ALsTlkPHsJ42V00VMozqdY9');

interface PaymentAuthorizationFormProps {
  clientSecret: string;
  bookingId: string;
  totalAmount: number;
  landlordResponseDeadline: string;
  onSuccess: () => void;
}

function CheckoutForm({ 
  clientSecret, 
  bookingId, 
  totalAmount, 
  landlordResponseDeadline, 
  onSuccess 
}: PaymentAuthorizationFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment authorization failed');
      } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
        // Payment authorized successfully
        setCompleted(true);
        
        // Verify the authorization on our backend
        const { error: verifyError } = await supabase.functions.invoke('verify-payment-authorization', {
          body: { paymentIntentId: paymentIntent.id }
        });

        if (verifyError) {
          console.error('Verification error:', verifyError);
        }

        toast.success('Payment authorized! Your booking request has been sent to the landlord.');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment authorization');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Payment Authorized Successfully!
          </h3>
          <p className="text-green-700 mb-4">
            Your booking request has been sent to the landlord. You will only be charged if they approve your request.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                Landlord response deadline: {new Date(landlordResponseDeadline).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Authorize Payment
        </CardTitle>
        <p className="text-muted-foreground">
          Complete payment authorization to submit your booking request.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-800 mb-1">Payment Authorization</h4>
                <p className="text-blue-700">
                  Your card will be authorized for €{totalAmount}, but you will only be charged if the landlord approves your request within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Element */}
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
            />
          </div>

          {/* Timing Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Response Deadline</h4>
            <p className="text-sm text-yellow-700">
              The landlord has until {new Date(landlordResponseDeadline).toLocaleString()} to respond. 
              If they don't respond by then, your authorization will be automatically cancelled.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={!stripe || loading}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing payment...
              </>
            ) : (
              `Authorize €${totalAmount} & Submit Request`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PaymentAuthorizationForm(props: PaymentAuthorizationFormProps) {
  const options = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}