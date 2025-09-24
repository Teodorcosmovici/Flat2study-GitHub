import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, User, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApprovedBooking {
  id: string;
  listing_id: string;
  tenant_id: string;
  check_in_date: string;
  check_out_date: string;
  monthly_rent: number;
  total_amount: number;
  payment_authorization_id: string;
  payment_status: string;
  status: string;
  created_at: string;
  // Additional fields from joins
  listing_title?: string;
  listing_address?: string;
  tenant_name?: string;
  tenant_email?: string;
}

export function AdminPaymentCapture() {
  const [approvedBookings, setApprovedBookings] = useState<ApprovedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [captureLoading, setCaptureLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedBookings();
  }, []);

  const fetchApprovedBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listings!inner(title, address_line, city),
          profiles!tenant_id(full_name, email)
        `)
        .eq('payment_status', 'approved_awaiting_capture')
        .eq('status', 'approved_awaiting_payment')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings = data.map((booking: any) => ({
        ...booking,
        listing_title: booking.listings?.title || 'Untitled Listing',
        listing_address: `${booking.listings?.address_line || ''}, ${booking.listings?.city || ''}`.trim(),
        tenant_name: booking.profiles?.full_name || 'Unknown',
        tenant_email: booking.profiles?.email || ''
      }));

      setApprovedBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching approved bookings:', error);
      toast.error('Failed to load approved bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePayment = async (bookingId: string, amount: number) => {
    setCaptureLoading(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('manual-capture-payment', {
        body: { bookingId }
      });

      if (error) throw error;

      toast.success(`Payment of €${amount} captured successfully!`);
      
      // Refresh the bookings list
      await fetchApprovedBookings();
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast.error(`Failed to capture payment: ${error.message}`);
    } finally {
      setCaptureLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (approvedBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No payments to capture</h3>
          <p className="text-muted-foreground">
            Approved bookings awaiting payment capture will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payment Capture</h2>
          <p className="text-muted-foreground">Manually capture payments for approved bookings</p>
        </div>
        <Button variant="outline" onClick={fetchApprovedBookings}>
          Refresh
        </Button>
      </div>

      {approvedBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{booking.listing_title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {booking.listing_address}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Awaiting Capture
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Tenant Information */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tenant Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{booking.tenant_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{booking.tenant_email}</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h4>
                <div className="text-sm">
                  <p><span className="text-muted-foreground">Check-in:</span> {new Date(booking.check_in_date).toLocaleDateString()}</p>
                  <p><span className="text-muted-foreground">Check-out:</span> {new Date(booking.check_out_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Details
                </h4>
                <div className="text-sm">
                  <p><span className="text-muted-foreground">Monthly rent:</span> €{booking.monthly_rent}</p>
                  <p><span className="text-muted-foreground">Total to capture:</span> <span className="font-semibold text-lg">€{booking.total_amount}</span></p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Payment authorized and approved by landlord
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Stripe Payment Intent ID: {booking.payment_authorization_id}
              </p>
            </div>

            {/* Capture Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => handleCapturePayment(booking.id, booking.total_amount)}
                disabled={captureLoading === booking.id}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {captureLoading === booking.id ? 'Capturing...' : `Capture €${booking.total_amount}`}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Booking created: {new Date(booking.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}