import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RentalApplicationForm } from '@/components/checkout/RentalApplicationForm';
import { PaymentSection } from '@/components/checkout/PaymentSection';
import { CheckInSection } from '@/components/checkout/CheckInSection';
import { CheckCircle, Home } from 'lucide-react';
import { ListingSummary } from '@/components/checkout/ListingSummary';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/types';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Rental Application', description: 'Tell us about yourself' },
  { id: 2, title: 'Payment method', description: 'Secure payment processing' },
  { id: 3, title: 'Done', description: 'Check-in information' }
];

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(searchParams.get('step') ? parseInt(searchParams.get('step')!) : 1);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Get dates from URL params
  const checkInDate = searchParams.get('checkin');
  const checkOutDate = searchParams.get('checkout');
  const persons = searchParams.get('persons') || '1';

  useEffect(() => {
    // Redirect to signup if not logged in
    if (!user) {
      navigate(`/signup/student?redirect=/checkout/${id}&checkin=${checkInDate}&checkout=${checkOutDate}&persons=${persons}`);
      return;
    }

    fetchListing();

    // Check for payment success
    const sessionId = searchParams.get('session_id');
    if (sessionId && currentStep === 3) {
      verifyPayment(sessionId);
    }
  }, [id, user, searchParams, currentStep]);

  const fetchListing = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'PUBLISHED')
        .single();

      if (error) throw error;
      
      // Transform database data to match Listing interface
      const transformedListing: Listing = {
        id: data.id,
        landlord: {
          id: data.agency_id,
          name: 'Landlord',
          phone: '',
          email: ''
        },
        title: data.title || '',
        type: data.type as any || 'room',
        description: data.description || '',
        addressLine: data.address_line || '',
        city: data.city || '',
        country: data.country || '',
        lat: data.lat,
        lng: data.lng,
        rentMonthlyEur: data.rent_monthly_eur || 0,
        depositEur: data.deposit_eur || 0,
        billsIncluded: data.bills_included || false,
        furnished: data.furnished || false,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        floor: data.floor,
        sizeSqm: data.size_sqm,
        amenities: Array.isArray(data.amenities) ? data.amenities.map(String) : [],
        availabilityDate: data.availability_date || '',
        images: Array.isArray(data.images) ? data.images.map(String) : [],
        videoUrl: data.video_url,
        createdAt: data.created_at || '',
        publishedAt: data.published_at,
        status: data.status as any || 'PUBLISHED',
        expiresAt: data.expires_at,
        bookingEnabled: data.booking_enabled,
        instantBooking: data.instant_booking,
        minimumStayDays: data.minimum_stay_days,
        maximumStayDays: data.maximum_stay_days,
        advanceBookingDays: data.advance_booking_days,
        priceHistory: Array.isArray(data.price_history) ? data.price_history : []
      };
      
      setListing(transformedListing);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-rental-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
        return;
      }

      if (data?.success) {
        setBookingData(data.booking);
        setPaymentVerified(true);
        toast.success('Payment confirmed! Your rental application has been submitted.');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    }
  };

  const handleApplicationSubmit = (data: any) => {
    setApplicationData(data);
    setCurrentStep(2);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setBookingData(paymentData);
    setCurrentStep(3);
  };

  if (!checkInDate || !checkOutDate) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Book your new place in minutes</h1>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.id <= currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3">
                  <div className={`font-medium ${
                    step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-8 ${
                    step.id < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <RentalApplicationForm
                listing={listing}
                onSubmit={handleApplicationSubmit}
              />
            )}
            
            {currentStep === 2 && (
              <PaymentSection
                listing={listing}
                applicationData={applicationData}
                checkInDate={new Date(checkInDate)}
                checkOutDate={new Date(checkOutDate)}
                persons={parseInt(persons)}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}
            
            {currentStep === 3 && paymentVerified && bookingData && (
              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-green-600">Application Submitted!</CardTitle>
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
            )}

            {currentStep === 3 && !paymentVerified && (
              <CheckInSection
                listing={listing}
                bookingData={bookingData}
                applicationData={applicationData}
              />
            )}
          </div>

          {/* Right Column - Listing Summary */}
          <div className="lg:col-span-1">
            <ListingSummary
              listing={listing}
              checkInDate={new Date(checkInDate)}
              checkOutDate={new Date(checkOutDate)}
              persons={parseInt(persons)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}