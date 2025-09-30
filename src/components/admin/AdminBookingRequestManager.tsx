import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, CheckCircle, XCircle, Calendar, Euro, User, MapPin, Building } from 'lucide-react';
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
  tenant_phone?: string | null;
  tenant_university?: string | null;
  application_message?: string | null;
  application_document_url?: string | null;
  application_document_type?: string | null;
  application_document_signed_url?: string | null;
  // Landlord info
  landlord_name?: string;
  landlord_email?: string;
}

export function AdminBookingRequestManager() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBookingRequests();
    
    // Set up real-time subscription for booking updates
    const subscription = supabase
      .channel('admin-booking-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings'
      }, () => {
        // Refresh requests when any booking is updated
        fetchAllBookingRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAllBookingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('payment_status', ['authorized', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional data separately
      const formattedRequests = await Promise.all(data.map(async (booking: any) => {
        // Get listing info
        const { data: listing } = await supabase
          .from('listings')
          .select('title, address_line, city')
          .eq('id', booking.listing_id)
          .single();

        // Get tenant info (profiles linked by user_id)
        const { data: tenant } = await supabase
          .from('profiles')
          .select('full_name, email, phone, university')
          .eq('user_id', booking.tenant_id)
          .maybeSingle();

        // Get landlord info
        const { data: landlord } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', booking.landlord_id)
          .maybeSingle();

        // If application document exists, create a short-lived signed URL
        let signedDocUrl: string | null = null;
        if (booking.application_document_url) {
          try {
            const { data: signed, error: urlError } = await supabase.storage
              .from('applications')
              .createSignedUrl(booking.application_document_url, 60 * 60); // 1 hour
            if (urlError) {
              console.error('Error creating signed URL:', urlError);
            } else {
              signedDocUrl = signed?.signedUrl || null;
            }
          } catch (error) {
            console.error('Error generating document URL:', error);
          }
        }

        return {
          ...booking,
          listing_title: listing?.title || 'Untitled Listing',
          listing_address: `${listing?.address_line || ''}, ${listing?.city || ''}`.trim(),
          tenant_name: tenant?.full_name || 'Unknown',
          tenant_email: tenant?.email || '',
          tenant_phone: tenant?.phone ?? null,
          tenant_university: tenant?.university ?? null,
          application_message: booking.application_message ?? null,
          application_document_url: booking.application_document_url ?? null,
          application_document_type: booking.application_document_type ?? null,
          application_document_signed_url: signedDocUrl,
          landlord_name: landlord?.full_name || 'Unknown',
          landlord_email: landlord?.email || '',
        } as BookingRequest;
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

      // Immediately remove the request from the local state
      setRequests(prevRequests => prevRequests.filter(req => req.id !== bookingId));

      toast.success(
        response === 'approved' 
          ? 'Booking approved! Payment captured successfully.' 
          : 'Booking declined. Payment authorization cancelled.'
      );

      // Refresh the requests list to ensure consistency
      await fetchAllBookingRequests();
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
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
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
            No pending booking requests to manage.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestRequest = requests[0]; // Get the most recent request

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Booking Requests</h2>
        <Button variant="outline" onClick={fetchAllBookingRequests}>
          Refresh
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="booking-requests" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {requests.length > 0 ? `${requests.length} Booking Request${requests.length > 1 ? 's' : ''}` : 'No Booking Requests'}
                </span>
                {latestRequest && (
                  <Badge variant="outline" className="text-xs">
                    Latest: {formatDistanceToNow(new Date(latestRequest.created_at))} ago
                  </Badge>
                )}
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {requests.map((request, index) => {
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
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              Landlord: {request.landlord_name}
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
                          <div>
                            <span className="text-muted-foreground">University:</span>
                            <p className="font-medium">{request.tenant_university || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{request.tenant_phone || 'Not provided'}</p>
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

                      {/* Application Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Application Message</h4>
                          <div className="text-sm border rounded-md p-3 bg-muted/20">
                            {request.application_message && request.application_message.trim().length > 0
                              ? request.application_message
                              : 'No message provided'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Supporting Document</h4>
                          <div className="text-sm">
                            {request.application_document_signed_url ? (
                              <a
                                href={request.application_document_signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                View document{request.application_document_type ? ` (${request.application_document_type})` : ''}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">No document uploaded</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Landlord Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-medium mb-2">Landlord Contact</h4>
                        <div className="text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {request.landlord_name}</p>
                          <p><span className="text-muted-foreground">Email:</span> {request.landlord_email}</p>
                        </div>
                      </div>

                      {/* Timing Information */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            {canRespond ? 'Response needed: ' : ''}
                            {getTimeRemaining(request.landlord_response_due_at)}
                          </span>
                        </div>
                        {canRespond && (
                          <p className="text-xs text-yellow-700 mt-1">
                            Admin can approve/decline on behalf of landlord.
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}