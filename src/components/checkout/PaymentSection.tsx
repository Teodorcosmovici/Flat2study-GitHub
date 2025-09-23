import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { Listing } from '@/types';

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
  
    const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      onPaymentSuccess({
        paymentId: 'payment_' + Date.now(),
        amount: (listing.rentMonthlyEur || 0) + Math.round((listing.rentMonthlyEur || 0) * 0.15),
        currency: 'EUR',
        status: 'completed',
        timestamp: new Date().toISOString(),
      });
    }, 2000);
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
                <span>€{listing.rentMonthlyEur}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>€{Math.round((listing.rentMonthlyEur || 0) * 0.15)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>€{(listing.rentMonthlyEur || 0) + Math.round((listing.rentMonthlyEur || 0) * 0.15)}</span>
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

          {/* Fake Payment Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Card Number</label>
                <div className="mt-1 p-3 border rounded-md bg-muted/30">
                  <span className="text-muted-foreground">**** **** **** 1234</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Expiry Date</label>
                  <div className="mt-1 p-3 border rounded-md bg-muted/30">
                    <span className="text-muted-foreground">MM/YY</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">CVV</label>
                  <div className="mt-1 p-3 border rounded-md bg-muted/30">
                    <span className="text-muted-foreground">***</span>
                  </div>
                </div>
              </div>
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

          <Button onClick={handlePayment} className="w-full h-12 text-base">
            Submit Application & Authorize Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}