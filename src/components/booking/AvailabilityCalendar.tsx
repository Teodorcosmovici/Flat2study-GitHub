import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAvailability } from '@/hooks/useAvailability';
import { format, addDays, parseISO } from 'date-fns';

interface AvailabilityCalendarProps {
  listingId: string;
  onDateSelect?: (checkIn: Date, checkOut: Date) => void;
  minStayDays?: number;
  maxStayDays?: number;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  listingId,
  onDateSelect,
  minStayDays = 30,
  maxStayDays = 365
}) => {
  const { availability, loading } = useAvailability(listingId);
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({});

  const unavailableDates = availability
    .filter(item => !item.is_available)
    .map(item => parseISO(item.date));

  const handleDayClick = (date: Date) => {
    if (!selectedRange.from || selectedRange.to) {
      // Start new selection
      setSelectedRange({ from: date });
    } else if (date < selectedRange.from) {
      // Select earlier date as start
      setSelectedRange({ from: date });
    } else {
      // Complete selection
      const daysDiff = Math.ceil((date.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < minStayDays) {
        // Extend to minimum stay
        const minEndDate = addDays(selectedRange.from, minStayDays);
        setSelectedRange({ from: selectedRange.from, to: minEndDate });
        onDateSelect?.(selectedRange.from, minEndDate);
      } else if (daysDiff > maxStayDays) {
        // Cap at maximum stay
        const maxEndDate = addDays(selectedRange.from, maxStayDays);
        setSelectedRange({ from: selectedRange.from, to: maxEndDate });
        onDateSelect?.(selectedRange.from, maxEndDate);
      } else {
        setSelectedRange({ from: selectedRange.from, to: date });
        onDateSelect?.(selectedRange.from, date);
      }
    }
  };

  const clearSelection = () => {
    setSelectedRange({});
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Stay Dates</CardTitle>
        {selectedRange.from && selectedRange.to && (
          <div className="text-sm text-muted-foreground">
            {format(selectedRange.from, 'MMM dd, yyyy')} - {format(selectedRange.to, 'MMM dd, yyyy')}
            <Button variant="ghost" size="sm" onClick={clearSelection} className="ml-2">
              Clear
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Calendar
          mode="range"
          selected={selectedRange.from && selectedRange.to ? selectedRange as { from: Date; to: Date } : undefined}
          onSelect={(range) => {
            if (range?.from) {
              handleDayClick(range.from);
            }
          }}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Disable past dates
            if (date < today) return true;
            
            // Disable unavailable dates
            const isUnavailable = unavailableDates.some(unavailableDate => 
              date.toDateString() === unavailableDate.toDateString()
            );
            
            if (isUnavailable) return true;
            
            // If we're selecting an end date and there are unavailable dates in between
            if (selectedRange.from && !selectedRange.to && date > selectedRange.from) {
              const daysBetween = Math.ceil((date.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24));
              for (let i = 1; i < daysBetween; i++) {
                const checkDate = new Date(selectedRange.from.getTime() + i * 24 * 60 * 60 * 1000);
                if (unavailableDates.some(unavailableDate => 
                  checkDate.toDateString() === unavailableDate.toDateString()
                )) {
                  return true; // Disable if there's an unavailable date in between
                }
              }
            }
            
            return false;
          }}
          className="w-full"
        />
        
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};