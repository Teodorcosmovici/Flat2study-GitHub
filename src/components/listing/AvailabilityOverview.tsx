import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AvailabilityOverviewProps {
  availabilityDate?: string;
  minimumStayDays?: number;
  maximumStayDays?: number;
  rentMonthlyEur: number;
}

export const AvailabilityOverview: React.FC<AvailabilityOverviewProps> = ({
  availabilityDate,
  minimumStayDays,
  maximumStayDays,
  rentMonthlyEur
}) => {
  const { t, language } = useLanguage();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatStayDuration = (days: number) => {
    if (days >= 30) {
      const months = Math.round(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${days} days`;
  };

  // Generate next 12 months for availability calendar
  const generateAvailabilityMonths = () => {
    const months = [];
    const startDate = new Date();
    const availabilityStart = availabilityDate ? new Date(availabilityDate) : startDate;
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthName = date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { month: 'short' });
      const year = date.getFullYear();
      
      // Available if the month is after or includes the availability date
      const available = date >= new Date(availabilityStart.getFullYear(), availabilityStart.getMonth(), 1);
      
      months.push({
        month: monthName,
        year: year,
        price: rentMonthlyEur,
        available: available
      });
    }
    
    return months;
  };

  const availabilityMonths = generateAvailabilityMonths();
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const currentYearMonths = availabilityMonths.filter(m => m.year === currentYear);
  const nextYearMonths = availabilityMonths.filter(m => m.year === nextYear);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('listing.availability')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Availability Calendar */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">{currentYear}</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {currentYearMonths.map((month, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-center ${
                    month.available 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="text-sm font-medium">{month.month}</div>
                  <div className="text-xs">{formatPrice(month.price)}</div>
                </div>
              ))}
            </div>
          </div>

          {nextYearMonths.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{nextYear}</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {nextYearMonths.map((month, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-center ${
                      month.available 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="text-sm font-medium">{month.month}</div>
                    <div className="text-xs">{formatPrice(month.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>{t('listing.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
            <span>{t('listing.occupied')}</span>
          </div>
        </div>

        {/* Availability Details */}
        <div className="space-y-3 pt-4 border-t">
          {availabilityDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('listing.availableFromColon')}</span>
              <span className="font-medium">
                {new Date(availabilityDate).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
          
          {minimumStayDays && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('listing.minStay')}</span>
              <span className="font-medium">{formatStayDuration(minimumStayDays)}</span>
            </div>
          )}
          
        </div>
      </CardContent>
    </Card>
  );
};