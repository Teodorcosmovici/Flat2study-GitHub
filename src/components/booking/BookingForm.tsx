import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { Listing } from '@/types';
import { BookingFormData } from '@/types/booking';

interface BookingFormProps {
  listing: Listing;
  onBookingCreated?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  listing,
  onBookingCreated
}) => {
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [selectedDates, setSelectedDates] = useState<{
    checkIn?: Date;
    checkOut?: Date;
  }>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateSelect = (checkIn: Date, checkOut: Date) => {
    setSelectedDates({ checkIn, checkOut });
  };

  const calculateTotalCost = () => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) {
      return {
        nights: 0,
        totalRent: 0,
        securityDeposit: 0,
        total: 0
      };
    }
    
    const nights = differenceInDays(selectedDates.checkOut, selectedDates.checkIn);
    const monthlyRent = listing.rentMonthlyEur;
    const dailyRate = monthlyRent / 30; // Approximate daily rate
    const totalRent = Math.round(dailyRate * nights);
    const securityDeposit = listing.depositEur;
    
    return {
      nights,
      totalRent,
      securityDeposit,
      total: totalRent + securityDeposit
    };
  };

  const handleSubmit = async () => {
    if (!user || !selectedDates.checkIn || !selectedDates.checkOut) return;

    try {
      setLoading(true);
      const costs = calculateTotalCost();
      
      await createBooking(
        listing.id,
        listing.landlord.id,
        format(selectedDates.checkIn, 'yyyy-MM-dd'),
        format(selectedDates.checkOut, 'yyyy-MM-dd'),
        costs.totalRent,
        costs.securityDeposit
      );

      onBookingCreated?.();
      
      // Reset form
      setSelectedDates({});
      setMessage('');
    } catch (error) {
      console.error('Booking submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please log in to make a booking request</p>
          <Button>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  const costs = calculateTotalCost();

  return (
    <div className="space-y-6">
      <AvailabilityCalendar
        listingId={listing.id}
        onDateSelect={handleDateSelect}
        minStayDays={30}
        maxStayDays={365}
      />

      {selectedDates.checkIn && selectedDates.checkOut && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span>{format(selectedDates.checkIn, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span>{format(selectedDates.checkOut, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{costs.nights} days</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Rent ({costs.nights} days):</span>
                <span>€{costs.totalRent}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <span>€{costs.securityDeposit}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>€{costs.total}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message to Property Owner (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and mention any specific requirements..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating Booking Request...' : 'Request to Book'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your booking request will be sent to the property owner for approval. 
              Payment will be processed only after confirmation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};