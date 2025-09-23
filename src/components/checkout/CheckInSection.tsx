import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, FileText, CreditCard, Home, Clock } from 'lucide-react';
import { Listing } from '@/types';

interface CheckInSectionProps {
  listing: Listing;
  bookingData: any;
  applicationData: any;
}

export function CheckInSection({ listing, bookingData, applicationData }: CheckInSectionProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-green-800">Application Submitted Successfully!</h2>
              <p className="text-green-700">Your rental application has been sent to the landlord</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-600 text-green-700">
                Pending Approval
              </Badge>
            </div>
            <div className="text-sm text-green-700">
              Reference: #{bookingData?.paymentId}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What happens next?
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium">Landlord Review</h3>
                <p className="text-sm text-muted-foreground">
                  The landlord will review your application and documents. This typically takes 24-48 hours.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium">Application Accepted</h3>
                <p className="text-sm text-muted-foreground">
                  Once accepted, you'll receive a confirmation email and your payment will be processed.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium">Contract & Check-in Details</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive the rental contract to sign and detailed check-in instructions.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-medium">Security Deposit</h3>
                <p className="text-sm text-muted-foreground">
                  Pay the security deposit directly to the landlord as specified in the contract.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your card has been authorized but not yet charged</li>
                <li>• Payment will only be processed if the landlord accepts your application</li>
                <li>• If rejected, no payment will be taken</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Check-in Preparation
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Prepare valid ID and proof of enrollment/employment</li>
                <li>• Security deposit: €{listing.depositEur || 'TBD'}</li>
                <li>• Check-in is typically during business hours</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Support Available
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Our team is available 24/7 for questions</li>
                <li>• You'll receive updates via email and SMS</li>
                <li>• Report any issues within 24 hours of check-in</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          View My Bookings
        </Button>
        <Button className="flex-1">
          Contact Support
        </Button>
      </div>
    </div>
  );
}