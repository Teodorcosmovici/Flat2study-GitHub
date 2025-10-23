import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Users, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAvailability } from '@/hooks/useAvailability';
import { Listing } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { RequestVisitDialog } from './RequestVisitDialog';

interface UnplacesBookingWidgetProps {
  listing: Listing;
  onBookingRequest?: (data: {
    checkIn: Date;
    checkOut: Date;
    persons: number;
  }) => void;
  onDatesChange?: (data: {
    checkIn: Date;
    checkOut: Date;
    persons: number;
  } | null) => void;
  onRecommendationChange?: (showing: boolean) => void;
}

export function UnplacesBookingWidget({ listing, onBookingRequest, onDatesChange, onRecommendationChange }: UnplacesBookingWidgetProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const [persons, setPersons] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [showVisitDialog, setShowVisitDialog] = useState(false);

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

  const calculateTotalRent = () => {
    if (!checkIn || !checkOut) return listing.rentMonthlyEur;
    
    let totalRent = 0;
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    let monthIndex = 0;
    while (currentMonth < endDate) {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const isFirstMonth = monthIndex === 0;
      const isSecondMonth = monthIndex === 1;
      const isLastMonth = nextMonth >= endDate;
      
      let monthlyRent = listing.rentMonthlyEur;
      
      if (isFirstMonth) {
        const moveInDay = startDate.getDate();
        // If move in after 15th, charge full rent for first month, half rent for second month
        if (moveInDay > 15) {
          monthlyRent = listing.rentMonthlyEur; // Full month
        }
      }
      
      if (isSecondMonth) {
        const moveInDay = startDate.getDate();
        // If moved in after 15th, charge half rent for second month
        if (moveInDay > 15) {
          monthlyRent = Math.round(listing.rentMonthlyEur / 2);
        }
      }
      
      if (isLastMonth) {
        const moveOutDay = endDate.getDate();
        // If move out before 15th, charge half rent
        if (moveOutDay < 15) {
          monthlyRent = Math.round(listing.rentMonthlyEur / 2);
        }
      }
      
      totalRent += monthlyRent;
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      monthIndex++;
    }
    
    return totalRent;
  };

  const handleCheckInSelect = (date: Date | undefined) => {
    if (!date) return;
    setCheckIn(date);
    setShowCheckInCalendar(false);
    setShowRecommendation(true); // Reset recommendation when date changes
    
    // If check-out is before or same as check-in, clear it
    if (checkOut && checkOut <= date) {
      setCheckOut(undefined);
      onDatesChange?.(null);
    } else if (checkOut) {
      // Both dates are selected, notify parent
      onDatesChange?.({ checkIn: date, checkOut, persons });
    }
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    if (!date) return;
    setCheckOut(date);
    setShowCheckOutCalendar(false);
    
    // Both dates are selected, notify parent
    if (checkIn) {
      onDatesChange?.({ checkIn, checkOut: date, persons });
    }
  };

  const handleSelectDates = () => {
    if (!checkIn || !checkOut) return;
    
    // Validate dates before submitting
    if (isDateDisabled(checkIn) || isCheckOutDisabled(checkOut)) {
      return; // Don't submit if dates are invalid
    }
    
    // Format dates for URL
    const checkinFormatted = checkIn.toISOString().split('T')[0];
    const checkoutFormatted = checkOut.toISOString().split('T')[0];
    
    // Navigate to checkout page
    navigate(`/checkout/${listing.id}?checkin=${checkinFormatted}&checkout=${checkoutFormatted}&persons=${persons}`);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable dates before the listing's availability date
    if (listing.availabilityDate) {
      const availableDate = new Date(listing.availabilityDate);
      availableDate.setHours(0, 0, 0, 0);
      if (date < availableDate) return true;
    }
    
    // Disable dates that are marked as unavailable
    return unavailableDates.some(unavailable => 
      unavailable.toDateString() === date.toDateString()
    );
  };

  const isCheckOutDisabled = (date: Date) => {
    if (isDateDisabled(date)) return true;
    if (!checkIn) return true;
    
    // Ensure move out is after move in
    if (date <= checkIn) return true;
    
    // Ensure minimum stay period based on landlord's setting
    const minimumStayDays = listing.minimumStayDays || 30; // Default to 30 days if not set
    const minimumCheckOutDate = new Date(checkIn);
    minimumCheckOutDate.setDate(minimumCheckOutDate.getDate() + minimumStayDays);
    return date < minimumCheckOutDate;
  };

  const recommendation = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    
    const date = checkIn.getDate();
    const month = checkIn.getMonth();
    const year = checkIn.getFullYear();
    
    // Check if within 6 days before mid-month (9th-15th)
    if (date >= 10 && date <= 15) {
      const sixteenthOfMonth = new Date(year, month, 16);
      const savings = Math.round(listing.rentMonthlyEur / 2);
      return {
        type: 'mid-month',
        recommendedDate: sixteenthOfMonth,
        savings: formatPrice(savings),
        message: language === 'it'
          ? `Se selezioni ${format(sixteenthOfMonth, "dd MMMM yyyy")} come data di trasloco, risparmierai metà mese di affitto (${formatPrice(savings)}).`
          : `If you select ${format(sixteenthOfMonth, "MMMM dd yyyy")} as your move-in, you'll save half a month of rent (${formatPrice(savings)}).`
      };
    }
    
    // Check if within 6 days before month-end (25th-31st)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    if (date >= 25 && date <= lastDayOfMonth) {
      const firstOfNextMonth = new Date(year, month + 1, 1);
      const savings = Math.round(listing.rentMonthlyEur / 2);
      return {
        type: 'month-end',
        recommendedDate: firstOfNextMonth,
        savings: formatPrice(savings),
        message: language === 'it'
          ? `Se selezioni ${format(firstOfNextMonth, "dd MMMM yyyy")} come data di trasloco, risparmierai metà mese di affitto (${formatPrice(savings)}).`
          : `If you select ${format(firstOfNextMonth, "MMMM dd yyyy")} as your move-in, you'll save half a month of rent (${formatPrice(savings)}).`
      };
    }
    
    return null;
  }, [checkIn, checkOut, listing.rentMonthlyEur, language]);

  // Notify parent when recommendation visibility changes
  useEffect(() => {
    onRecommendationChange?.(!!recommendation && showRecommendation);
  }, [recommendation, showRecommendation, onRecommendationChange]);

  const handleDismissRecommendation = () => {
    setShowRecommendation(false);
  };

  const handleChangeDates = () => {
    if (recommendation?.recommendedDate) {
      setCheckIn(recommendation.recommendedDate);
      setCheckOut(undefined);
      setShowRecommendation(false);
      onDatesChange?.(null);
    } else {
      setCheckIn(undefined);
      setCheckOut(undefined);
      setShowRecommendation(true);
      onDatesChange?.(null);
    }
  };

  return (
    <Card className={cn(
      isMobile
        ? "fixed bottom-0 left-0 right-0 z-50 rounded-t-xl rounded-b-none border-t shadow-2xl bg-background/95 backdrop-blur-md"
        : "sticky top-24"
    )}>
      <CardContent className={cn(
        "p-6 space-y-6",
        isMobile && "p-2 space-y-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
      )}>
        {/* Desktop: Full widget */}
        {!isMobile && (
          <>
            {/* Price Display */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold">{formatPrice(listing.rentMonthlyEur)}</span>
                <span className="text-muted-foreground">{t('booking.perMonth')}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>{persons} {persons > 1 ? t('booking.persons') : t('booking.person')}</span>
              </div>
            </div>

            {/* Date Recommendation Alert */}
            {recommendation && showRecommendation && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="flex flex-col space-y-3">
                  <p className="text-sm">
                    {recommendation.message}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissRecommendation}
                      className="text-green-700 hover:text-green-800 hover:bg-green-100 px-3 py-1 h-auto font-medium"
                    >
                      {t('booking.okWithDates')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChangeDates}
                      className="border-green-300 text-green-700 hover:text-green-800 hover:bg-green-100 px-3 py-1 h-auto font-medium"
                    >
                      {t('booking.changeDates')}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Date selectors - mobile compact vs desktop */}
        {isMobile ? (
          <>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <label className="sr-only">{t('booking.moveInLabel')}</label>
                <Popover open={showCheckInCalendar} onOpenChange={setShowCheckInCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 text-sm",
                        !checkIn && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {checkIn ? format(checkIn, "dd MMM") : t('booking.moveIn')}
                    </Button>
                  </PopoverTrigger>
                    <PopoverContent side="top" sideOffset={12} collisionPadding={{ left: 16, right: 16 }} className="w-auto p-0 bg-background/95 backdrop-blur-sm border shadow-lg z-[100]" align="start">
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

              <div>
                <label className="sr-only">{t('booking.moveOutLabel')}</label>
                <Popover open={showCheckOutCalendar} onOpenChange={setShowCheckOutCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 text-sm",
                        !checkOut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {checkOut ? format(checkOut, "dd MMM") : t('booking.moveOut')}
                    </Button>
                  </PopoverTrigger>
                    <PopoverContent side="top" sideOffset={12} collisionPadding={{ left: 16, right: 16 }} className="w-auto p-0 bg-background/95 backdrop-blur-sm border shadow-lg z-[100]" align="start">
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

              <Button
                className="w-full h-10 text-sm"
                onClick={handleSelectDates}
                disabled={!checkIn || !checkOut || loading || isDateDisabled(checkIn || new Date()) || isCheckOutDisabled(checkOut || new Date())}
              >
                {loading ? t('booking.loading') : t('booking.continue')}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {t('booking.nothingCharged')}
            </p>
          </>
        ) : (
          <div className={cn(
            "grid grid-cols-2 gap-3",
            isMobile && "gap-2"
          )}>
            {/* Move In Date */}
            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium text-muted-foreground",
                isMobile && "text-xs"
              )}>{t('booking.moveInLabel')}</label>
              <Popover open={showCheckInCalendar} onOpenChange={setShowCheckInCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !checkIn && "text-muted-foreground",
                      isMobile && "h-10 text-sm"
                    )}
                  >
                    <CalendarIcon className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3 mr-1")} />
                    {checkIn ? format(checkIn, "dd MMM") : t('booking.selectDates')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-[100]" align="start">
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
              <label className={cn(
                "text-sm font-medium text-muted-foreground",
                isMobile && "text-xs"
              )}>{t('booking.moveOutLabel')}</label>
              <Popover open={showCheckOutCalendar} onOpenChange={setShowCheckOutCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !checkOut && "text-muted-foreground",
                      isMobile && "h-10 text-sm"
                    )}
                  >
                    <CalendarIcon className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3 mr-1")} />
                    {checkOut ? format(checkOut, "dd MMM") : t('booking.selectDates')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border shadow-lg z-[100]" align="start">
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
        )}


        {/* Desktop: Select button and note */}
        {!isMobile && (
          <>
            <Button 
              className={cn(
                "w-full h-12 text-base font-medium",
                isMobile && "h-10 text-sm"
              )}
              onClick={handleSelectDates}
              disabled={!checkIn || !checkOut || loading || isDateDisabled(checkIn || new Date()) || isCheckOutDisabled(checkOut || new Date())}
            >
              {loading ? t('booking.loading') : t('booking.continue')}
            </Button>

            <Button 
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={() => setShowVisitDialog(true)}
            >
              {t('booking.requestVisit')}
            </Button>

            {/* Availability Note */}
            <p className={cn(
              "text-xs text-muted-foreground text-center",
              isMobile && "text-[10px]"
            )}>
              {t('booking.nothingCharged')}
            </p>
          </>
        )}
      </CardContent>

      <RequestVisitDialog 
        listing={listing}
        open={showVisitDialog}
        onOpenChange={setShowVisitDialog}
      />
    </Card>
  );
}