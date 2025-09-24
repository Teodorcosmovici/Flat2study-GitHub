import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Calendar, Euro, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BookingRequest {
  id: string;
  listing_id: string;
  tenant_id: string;
  check_in_date: string;
  check_out_date: string;
  monthly_rent: number;
  total_amount: number;
  payment_status: string;
  landlord_response_due_at: string;
  landlord_response?: string;
  status: string;
  created_at: string;
  // Additional fields from joins
  listing_title?: string;
  listing_address?: string;
  tenant_name?: string;
  tenant_email?: string;
}

interface BookingRequestManagerProps {
  landlordId: string;
}

export function BookingRequestManager({ landlordId }: BookingRequestManagerProps) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingRequests();
  }, [landlordId]);

  const fetchBookingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listings!inner(title, address_line, city),
          profiles!tenant_id(full_name, email)
        `)
        .eq('landlord_id', landlordId)
        .in('payment_status', ['authorized', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = data.map((booking: any) => ({
        ...booking,
        listing_title: booking.listings?.title || 'Untitled Listing',
        listing_address: `${booking.listings?.address_line || ''}, ${booking.listings?.city || ''}`.trim(),
        tenant_name: booking.profiles?.full_name || 'Unknown',
        tenant_email: booking.profiles?.email || ''
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (bookingId: string, response: 'approved' | 'declined') => {
    setActionLoading(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('capture-payment', {
        body: {
          bookingId,
          landlordResponse: response
        }
      });

      if (error) throw error;

      toast.success(
        response === 'approved' 
          ? 'Booking approved! Payment will need to be captured manually from admin dashboard.' 
          : 'Booking declined and payment cancelled.'
      );

      // Refresh the requests list
      await fetchBookingRequests();
    } catch (error) {
      console.error('Error processing booking response:', error);
      toast.error(`Failed to ${response} booking: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (request: BookingRequest) => {
    const now = new Date();
    const deadline = new Date(request.landlord_response_due_at);
    const isExpired = now > deadline;

    if (request.landlord_response === 'approved') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved (Manual Capture Needed)</Badge>;
    }
    if (request.landlord_response === 'declined') {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Declined</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (request.payment_status === 'authorized') {
      return <Badge variant="default">Awaiting Response</Badge>;
    }
    return <Badge variant="outline">Pending Payment</Badge>;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (now > deadlineDate) {
      return `Expired ${formatDistanceToNow(deadlineDate)} ago`;
    }
    
    return `${formatDistanceToNow(deadlineDate)} remaining`;
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

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No booking requests</h3>
          <p className="text-muted-foreground">
            You'll see booking requests from tenants here when they apply for your properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Booking Requests</h2>
        <Button variant="outline" onClick={fetchBookingRequests}>
          Refresh
        </Button>
      </div>

      {requests.map((request) => {
        const now = new Date();
        const deadline = new Date(request.landlord_response_due_at);
        const isExpired = now > deadline;
        const canRespond = !request.landlord_response && !isExpired && request.payment_status === 'authorized';

        return (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{request.listing_title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.listing_address}
                    </div>
                  </div>
                </div>
                {getStatusBadge(request)}
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
                    <p className="font-medium">{request.tenant_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{request.tenant_email}</p>
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
                    <p><span className="text-muted-foreground">Check-in:</span> {new Date(request.check_in_date).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Check-out:</span> {new Date(request.check_out_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Payment
                  </h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Monthly rent:</span> €{request.monthly_rent}</p>
                    <p><span className="text-muted-foreground">Total authorized:</span> €{request.total_amount}</p>
                  </div>
                </div>
              </div>

              {/* Timing Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {canRespond ? 'Response needed: ' : ''}
                    {getTimeRemaining(request.landlord_response_due_at)}
                  </span>
                </div>
                {canRespond && (
                  <p className="text-xs text-blue-700 mt-1">
                    Payment will be captured if approved, or cancelled if declined/expired.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {canRespond && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleResponse(request.id, 'approved')}
                    disabled={actionLoading === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading === request.id ? 'Processing...' : 'Approve & Capture Payment'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleResponse(request.id, 'declined')}
                    disabled={actionLoading === request.id}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading === request.id ? 'Processing...' : 'Decline'}
                  </Button>
                </div>
              )}

              {request.landlord_response && (
                <div className="text-sm text-muted-foreground">
                  Responded: {new Date(request.created_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}