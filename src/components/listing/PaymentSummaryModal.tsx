import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle, ArrowRight } from 'lucide-react';

interface PaymentSummaryModalProps {
  rentMonthlyEur: number;
  depositEur?: number;
  selectedDates?: {
    checkIn: Date;
    checkOut: Date;
    persons: number;
  };
  children: React.ReactNode;
}

export const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({
  rentMonthlyEur,
  depositEur = 0,
  selectedDates,
  children
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateProratedRent = (date: Date, isFirstMonth: boolean, isLastMonth: boolean, totalDays: number) => {
    if (!isFirstMonth && !isLastMonth) return rentMonthlyEur;
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    let daysToCharge = daysInMonth;
    
    if (isFirstMonth && selectedDates) {
      const startDay = selectedDates.checkIn.getDate();
      daysToCharge = daysInMonth - startDay + 1;
    }
    
    if (isLastMonth && selectedDates) {
      const endDay = selectedDates.checkOut.getDate();
      daysToCharge = endDay;
    }
    
    // If partial month is less than 15 days, charge half rent
    if (daysToCharge < 15) {
      return Math.round(rentMonthlyEur / 2);
    }
    
    return rentMonthlyEur;
  };

  const serviceFee = Math.round(rentMonthlyEur * 0.4); // 40% of monthly rent
  const firstPaymentTotal = rentMonthlyEur + serviceFee;
  const afterBookingTotal = depositEur + 120 + 35 + 35; // Security deposit + Cleaning fee + Electricity + Gas
  const monthlyTotal = rentMonthlyEur + 70; // Monthly rent + Electricity + Gas

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment summary</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* When your booking is accepted */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">When your booking is accepted</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Through our platform</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(firstPaymentTotal)}</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 text-sm mt-3">
                <div className="flex justify-between">
                  <span>First rental payment</span>
                  <span>{formatPrice(rentMonthlyEur)}</span>
                </div>
                <div className="flex justify-between">
                  <span>One-time service fee</span>
                  <span>{formatPrice(serviceFee)}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* After booking is confirmed */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">After booking is confirmed</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">To landlord</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(afterBookingTotal)}</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 text-sm mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">One-time payments</div>
                <div className="flex justify-between">
                  <span>Security deposit</span>
                  <span>{formatPrice(depositEur)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(120)}</span>
                </div>
                
                <div className="text-xs font-medium text-muted-foreground mb-2 mt-4">Monthly payments</div>
                <div className="flex justify-between items-center">
                  <span>Water</span>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 text-xs">Included</span>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Internet</span>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 text-xs">Included</span>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Electricity</span>
                  <span>{formatPrice(35)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas</span>
                  <span>{formatPrice(35)}</span>
                </div>
                
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Monthly rent breakdown */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">Monthly rent</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">To landlord</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(rentMonthlyEur)}</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 text-sm mt-3">
                {selectedDates ? (
                  // Show months based on selected dates
                  (() => {
                    const months = [];
                    const startDate = new Date(selectedDates.checkIn);
                    const endDate = new Date(selectedDates.checkOut);
                    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    const totalStayDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let monthIndex = 0;
                    while (currentMonth < endDate) {
                      const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const isFirstMonth = currentMonth.getMonth() === startDate.getMonth() && currentMonth.getFullYear() === startDate.getFullYear();
                      const nextMonth = new Date(currentMonth);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      const isLastMonth = nextMonth >= endDate;
                      
                      const monthlyRent = calculateProratedRent(currentMonth, isFirstMonth, isLastMonth, totalStayDays);
                      const isProrated = monthlyRent !== rentMonthlyEur;
                      
                      months.push(
                        <div key={currentMonth.getTime()} className="flex justify-between">
                          <span>
                            {monthName} 
                            {isFirstMonth && <span className="text-xs text-green-600">(already paid)</span>}
                            {isProrated && <span className="text-xs text-orange-600">(prorated)</span>}
                          </span>
                          <span className={isFirstMonth ? "text-green-600" : ""}>{formatPrice(monthlyRent)}</span>
                        </div>
                      );
                      
                      currentMonth.setMonth(currentMonth.getMonth() + 1);
                      monthIndex++;
                    }
                    
                    return months;
                  })()
                ) : (
                  // Default 12 months view when no dates selected
                  Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + i);
                    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <div key={i} className="flex justify-between">
                        <span>{monthName}</span>
                        <span>{formatPrice(rentMonthlyEur)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bottom notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              If you find it cheaper elsewhere, we'll refund the difference.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};