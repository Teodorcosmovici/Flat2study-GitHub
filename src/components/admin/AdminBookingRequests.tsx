import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Mail, Phone, User, Home, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface BookingRequest {
  id: string;
  tenant_id: string;
  listing_id: string;
  status: string;
  payment_status: string;
  check_in_date: string;
  check_out_date: string;
  monthly_rent: number;
  total_amount: number;
  created_at: string;
  tenant_full_name: string;
  tenant_email: string;
  tenant_phone: string;
  tenant_university: string;
  listing_title: string;
  listing_address_line: string;
}

export const AdminBookingRequests = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          tenant_id,
          listing_id,
          status,
          payment_status,
          check_in_date,
          check_out_date,
          monthly_rent,
          total_amount,
          created_at,
          tenant:profiles!bookings_tenant_id_fkey (
            full_name,
            email,
            phone,
            university
          ),
          listing:listings!bookings_listing_id_fkey (
            title,
            address_line
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings: BookingRequest[] = (data || []).map((booking: any) => ({
        id: booking.id,
        tenant_id: booking.tenant_id,
        listing_id: booking.listing_id,
        status: booking.status,
        payment_status: booking.payment_status,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        monthly_rent: booking.monthly_rent,
        total_amount: booking.total_amount,
        created_at: booking.created_at,
        tenant_full_name: booking.tenant?.full_name || 'N/A',
        tenant_email: booking.tenant?.email || 'N/A',
        tenant_phone: booking.tenant?.phone || 'N/A',
        tenant_university: booking.tenant?.university || 'N/A',
        listing_title: booking.listing?.title || 'N/A',
        listing_address_line: booking.listing?.address_line || 'N/A',
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast({
        title: "Error",
        description: "Failed to load booking requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'authorized': 'bg-blue-100 text-blue-800',
      'captured': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={statusColors[paymentStatus] || 'bg-gray-100 text-gray-800'}>
        {paymentStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Loading booking requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Booking Requests</span>
          <Badge variant="outline">{bookings.length} Total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No booking requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.tenant_full_name}</span>
                        </div>
                        {booking.tenant_university !== 'N/A' && (
                          <div className="text-xs text-muted-foreground">{booking.tenant_university}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{booking.tenant_email}</span>
                        </div>
                        {booking.tenant_phone !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{booking.tenant_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        <div className="flex items-start gap-2">
                          <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{booking.listing_title}</div>
                            <div className="text-xs text-muted-foreground">{booking.listing_address_line}</div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{new Date(booking.check_in_date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            to {new Date(booking.check_out_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">€{booking.total_amount}</div>
                        <div className="text-xs text-muted-foreground">€{booking.monthly_rent}/mo</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(booking.payment_status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/listing/${booking.listing_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
