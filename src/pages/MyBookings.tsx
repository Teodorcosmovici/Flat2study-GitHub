import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { BookingCard } from '@/components/booking/BookingCard';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MyBookings() {
  const { bookings, loading, updateBookingStatus } = useBookings();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const userRole = profile?.user_type === 'student' ? 'tenant' : 'landlord';

  const handleCancelRequest = async () => {
    if (!selectedBookingId) return;

    try {
      const { error } = await supabase
        .from('cancellation_requests')
        .insert({
          booking_id: selectedBookingId,
          tenant_id: profile?.user_id,
          reason: cancelReason || 'No reason provided'
        });

      if (error) throw error;

      toast.success('Cancellation request submitted successfully! An admin will review it.');
      setCancelReason('');
      setSelectedBookingId(null);
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      toast.error('Failed to submit cancellation request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {userRole === 'tenant' ? 'My Bookings' : 'Booking Requests'}
            </h1>
            <p className="text-muted-foreground">
              {userRole === 'tenant' 
                ? 'Manage your property bookings and reservations'
                : 'Review and manage booking requests for your properties'
              }
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back Home
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">
              {userRole === 'tenant' ? 'No bookings yet' : 'No booking requests yet'}
            </h2>
            <p className="text-muted-foreground">
              {userRole === 'tenant' 
                ? 'Start exploring properties and make your first booking'
                : 'Booking requests will appear here when students request to book your properties'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole={userRole}
                onStatusUpdate={updateBookingStatus}
                onCancelRequest={(bookingId) => setSelectedBookingId(bookingId)}
              />
            ))}
          </div>
        )}

        {/* Cancel Request Dialog */}
        <AlertDialog open={!!selectedBookingId} onOpenChange={() => setSelectedBookingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Cancellation</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for cancelling this booking. Your request will be reviewed by an admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setCancelReason('');
                setSelectedBookingId(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelRequest}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}