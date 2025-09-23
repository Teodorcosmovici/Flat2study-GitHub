import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { Listing } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface PaymentSectionProps {
  listing: Listing;
  applicationData: any;
  checkInDate: Date;
  checkOutDate: Date;
  persons: number;
  onPaymentSuccess: (paymentData: any) => void;
}

export function PaymentSection({ 
  listing, 
  applicationData, 
  checkInDate, 
  checkOutDate, 
  persons, 
  onPaymentSuccess 
}: PaymentSectionProps) {
  const [loading, setLoading] = useState(false);
  
  // Align amounts with the "Review price details" modal
  const monthlyRate = listing.rentMonthlyEur || 0;
  const serviceFee = Math.round(monthlyRate * 0.4); // 40%
  const moveInDay = checkInDate.getDate();
  const firstMonthRent = moveInDay > 15 ? Math.round(monthlyRate / 2) : monthlyRate; // half month if move-in after 15th
  const totalToAuthorize = firstMonthRent + serviceFee;
  
  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Call the create-rental-payment edge function
      const { data, error } = await supabase.functions.invoke('create-rental-payment', {
        body: {
          listingId: listing.id,
          landlordId: listing.landlord.id,
          checkInDate: checkInDate.toISOString().split('T')[0],
          checkOutDate: checkOutDate.toISOString().split('T')[0],
          firstMonthRent,
          serviceFee,
          totalAmount: totalToAuthorize,
          applicationData
        }
      });

      if (error) {
        console.error('Error creating payment session:', error);
        toast.error('Failed to create payment session');
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        toast.success('Redirecting to secure payment...');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <p className="text-muted-foreground">
          Secure payment processing. You will only be charged if the landlord accepts your application.
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>First month rent</span>
                <span>€{firstMonthRent}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>€{serviceFee}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>€{totalToAuthorize}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Select Payment Method</h3>
            
            <div className="border rounded-lg p-4 bg-primary/5 border-primary">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Secure Checkout */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Secure Payment</h4>
              <p className="text-sm text-blue-700">
                Your payment will be processed securely through Stripe. You'll be redirected to a secure payment page where you can enter your card details.
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Important</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You will only be charged if the landlord accepts your application</li>
              <li>• Your card will be authorized but not charged immediately</li>
              <li>• You can cancel your request until the landlord responds</li>
            </ul>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating secure payment...
              </>
            ) : (
              'Submit Application & Authorize Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}