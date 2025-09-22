import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAvailability } from '@/hooks/useAvailability';
import { Listing } from '@/types';

interface UnplacesBookingWidgetProps {
  listing: Listing;
  onBookingRequest?: (data: {
    checkIn: Date;
    checkOut: Date;
    persons: number;
  }) => void;
}

export function UnplacesBookingWidget({ listing, onBookingRequest }: UnplacesBookingWidgetProps) {
  const [persons, setPersons] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

  const { availability, loading } = useAvailability(listing.id);

  const unavailableDates = availability
    .filter(slot => !slot.is_available)
    .map(slot => new Date(slot.date));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCheckInSelect = (date: Date | undefined) => {
    if (!date) return;
    setCheckIn(date);
    setShowCheckInCalendar(false);
    
    // If check-out is before or same as check-in, clear it
    if (checkOut && checkOut <= date) {
      setCheckOut(undefined);
    }
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    if (!date) return;
    setCheckOut(date);
    setShowCheckOutCalendar(false);
  };

  const handleSelectDates = () => {
    if (checkIn && checkOut && onBookingRequest) {
      onBookingRequest({
        checkIn,
        checkOut,
        persons
      });
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    
    return unavailableDates.some(unavailable => 
      unavailable.toDateString() === date.toDateString()
    );
  };

  const isCheckOutDisabled = (date: Date) => {
    if (isDateDisabled(date)) return true;
    if (!checkIn) return true;
    return date <= checkIn;
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6 space-y-6">
        {/* Price Display */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{formatPrice(listing.rentMonthlyEur)}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{persons} person{persons > 1 ? 's' : ''}</span>
          </div>
        </div>


        {/* Date Selectors */}
        <div className="grid grid-cols-2 gap-3">
          {/* Move In Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">MOVE IN</label>
            <Popover open={showCheckInCalendar} onOpenChange={setShowCheckInCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !checkIn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, "dd MMM") : "Select dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={handleCheckInSelect}
                  disabled={isDateDisabled}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Move Out Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">MOVE OUT</label>
            <Popover open={showCheckOutCalendar} onOpenChange={setShowCheckOutCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !checkOut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, "dd MMM") : "Select dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={handleCheckOutSelect}
                  disabled={isCheckOutDisabled}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Booking Summary */}
        {checkIn && checkOut && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span>Duration:</span>
              <span>{calculateNights()} nights</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Monthly rent:</span>
              <span>{formatPrice(listing.rentMonthlyEur)}</span>
            </div>
            {listing.depositEur > 0 && (
              <div className="flex justify-between text-sm">
                <span>Security deposit:</span>
                <span>{formatPrice(listing.depositEur)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>{formatPrice(listing.rentMonthlyEur + (listing.depositEur || 0))}</span>
            </div>
          </div>
        )}

        {/* Select Dates Button */}
        <Button 
          className="w-full h-12 text-base font-medium"
          onClick={handleSelectDates}
          disabled={!checkIn || !checkOut || loading}
        >
          {loading ? 'Loading...' : 'Select dates'}
        </Button>

        {/* Availability Note */}
        <p className="text-xs text-muted-foreground text-center">
          Available from {listing.availabilityDate ? format(new Date(listing.availabilityDate), 'dd MMM yyyy') : 'immediately'}
        </p>
      </CardContent>
    </Card>
  );
}