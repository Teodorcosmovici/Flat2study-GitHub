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
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentSummaryModalProps {
  rentMonthlyEur: number;
  depositEur?: number;
  landlordAdminFee?: number;
  utilities?: {
    electricity: { included: boolean; cost: number };
    gas: { included: boolean; cost: number };
    water: { included: boolean; cost: number };
    internet: { included: boolean; cost: number };
  };
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
  landlordAdminFee = 0,
  utilities,
  selectedDates,
  children
}) => {
  const { t } = useLanguage();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateFirstMonthPayment = () => {
    if (!selectedDates) return rentMonthlyEur;
    
    const moveInDay = selectedDates.checkIn.getDate();
    
    // If move in after 15th, charge full rent for first month (mid-month rent is paid in second month)
    if (moveInDay > 15) {
      return rentMonthlyEur; // Full month
    }
    
    return rentMonthlyEur;
  };

  const calculateProratedRent = (date: Date, isFirstMonth: boolean, isLastMonth: boolean, monthIndex: number) => {
    if (!selectedDates) return rentMonthlyEur;
    
    if (isFirstMonth) {
      const moveInDay = selectedDates.checkIn.getDate();
      // If move in after 15th, charge full rent for first month
      return rentMonthlyEur;
    }
    
    if (monthIndex === 1) { // Second month
      const moveInDay = selectedDates.checkIn.getDate();
      // If moved in after 15th, charge half rent for second month
      if (moveInDay > 15) {
        return Math.round(rentMonthlyEur / 2);
      }
      return rentMonthlyEur;
    }
    
    if (isLastMonth) {
      const moveOutDay = selectedDates.checkOut.getDate();
      // If move out before 15th, charge half rent
      if (moveOutDay < 15) {
        return Math.round(rentMonthlyEur / 2);
      }
      return rentMonthlyEur;
    }
    
    return rentMonthlyEur;
  };

  const serviceFee = Math.round(rentMonthlyEur * 0.4); // 40% of monthly rent
  const firstMonthRent = calculateFirstMonthPayment();
  const firstPaymentTotal = firstMonthRent + serviceFee;
  
  // Calculate monthly utilities total
  const monthlyUtilitiesTotal = utilities ? (
    (!utilities.electricity.included ? utilities.electricity.cost : 0) +
    (!utilities.gas.included ? utilities.gas.cost : 0) +
    (!utilities.water.included ? utilities.water.cost : 0) +
    (!utilities.internet.included ? utilities.internet.cost : 0)
  ) : 0;
  
  const afterBookingTotal = depositEur + landlordAdminFee + monthlyUtilitiesTotal;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('paymentSummary.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* When your booking is accepted */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('paymentSummary.whenBookingAccepted')}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('paymentSummary.throughPlatform')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(firstPaymentTotal)}</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 text-sm mt-3">
                <div className="flex justify-between">
                  <span>{t('paymentSummary.firstRentalFull')}</span>
                  <span>{formatPrice(firstMonthRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('paymentSummary.oneTimeServiceFee')}</span>
                  <span>{formatPrice(serviceFee)}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* After booking is confirmed */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('paymentSummary.afterBookingConfirmed')}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('paymentSummary.toLandlord')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatPrice(afterBookingTotal)}</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 text-sm mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">{t('paymentSummary.oneTimePayment')}</div>
                <div className="flex justify-between">
                  <span>{t('paymentSummary.securityDeposit')}</span>
                  <span>{formatPrice(depositEur)}</span>
                </div>
                {landlordAdminFee > 0 && (
                  <div className="flex justify-between">
                    <span>{t('paymentSummary.landlordAdminFee')}</span>
                    <span>{formatPrice(landlordAdminFee)}</span>
                  </div>
                )}
                
                <div className="text-xs font-medium text-muted-foreground mb-2 mt-4">{t('paymentSummary.monthlyPayments')}</div>
                <div className="flex justify-between items-center">
                  <span>{t('paymentSummary.water')}</span>
                  {utilities?.water.included ? (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 text-xs">{t('paymentSummary.included')}</span>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <span>{formatPrice(utilities?.water.cost || 0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('paymentSummary.internet')}</span>
                  {utilities?.internet.included ? (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 text-xs">{t('paymentSummary.included')}</span>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <span>{formatPrice(utilities?.internet.cost || 0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('paymentSummary.electricity')}</span>
                  {utilities?.electricity.included ? (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 text-xs">{t('paymentSummary.included')}</span>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <span>{formatPrice(utilities?.electricity.cost || 0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('paymentSummary.gas')}</span>
                  {utilities?.gas.included ? (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 text-xs">{t('paymentSummary.included')}</span>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <span>{formatPrice(utilities?.gas.cost || 0)}</span>
                  )}
                </div>
                
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Monthly rent breakdown */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border rounded-lg px-4 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('paymentSummary.monthlyRent')}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('paymentSummary.toLandlord')}</span>
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
                    
                    let monthIndex = 0;
                    while (currentMonth < endDate) {
                      const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const isFirstMonth = currentMonth.getMonth() === startDate.getMonth() && currentMonth.getFullYear() === startDate.getFullYear();
                      const nextMonth = new Date(currentMonth);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      const isLastMonth = nextMonth >= endDate;
                      
                      const monthlyRent = calculateProratedRent(currentMonth, isFirstMonth, isLastMonth, monthIndex);
                      const isProrated = monthlyRent !== rentMonthlyEur;
                      
                        months.push(
                        <div key={currentMonth.getTime()} className="flex justify-between">
                          <span>
                            {monthName} 
                            {isFirstMonth && <span className="text-xs text-green-600">{t('paymentSummary.alreadyPaid')}</span>}
                            {isProrated && !isFirstMonth && <span className="text-xs text-orange-600">{t('paymentSummary.prorated')}</span>}
                          </span>
                          <span className={isFirstMonth ? "text-green-600" : ""}>{formatPrice(isFirstMonth ? 0 : monthlyRent)}</span>
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
              {t('paymentSummary.priceMatchGuarantee')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};