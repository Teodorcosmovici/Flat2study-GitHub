import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Euro, Clock, X } from 'lucide-react';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: Booking;
  onStatusUpdate?: (bookingId: string, status: string) => void;
  onCancelRequest?: (bookingId: string) => void;
  userRole?: 'tenant' | 'landlord';
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onStatusUpdate,
  onCancelRequest,
  userRole = 'tenant'
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const canUpdateStatus = userRole === 'landlord' && booking.status === 'pending';
  const canCancelRequest = userRole === 'tenant' && ['pending_landlord_response', 'pending_payment', 'confirmed'].includes(booking.status);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking #{booking.id.slice(0, 8)}</CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Check-in</p>
              <p className="text-muted-foreground">
                {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Check-out</p>
              <p className="text-muted-foreground">
                {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Monthly Rent:</span>
            <span className="font-medium">€{booking.monthly_rent}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Security Deposit:</span>
            <span className="font-medium">€{booking.security_deposit}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total Amount:</span>
            <span>€{booking.total_amount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Created {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}</span>
        </div>

        {canUpdateStatus && (
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate?.(booking.id, 'confirmed')}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate?.(booking.id, 'cancelled')}
            >
              Decline
            </Button>
          </div>
        )}

        {canCancelRequest && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelRequest?.(booking.id)}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Rental Request
            </Button>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🎉 Booking confirmed! Payment processing will begin shortly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};