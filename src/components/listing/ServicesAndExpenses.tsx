import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Euro, Zap, Droplet, Wifi, Flame, Calendar } from 'lucide-react';

interface ServicesAndExpensesProps {
  billsIncluded?: boolean;
  rentMonthlyEur: number;
  depositEur?: number;
}

export const ServicesAndExpenses: React.FC<ServicesAndExpensesProps> = ({
  billsIncluded,
  rentMonthlyEur,
  depositEur
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const utilities = [
    {
      name: 'Water',
      icon: <Droplet className="h-4 w-4" />,
      included: billsIncluded,
      price: billsIncluded ? 0 : 30
    },
    {
      name: 'Electricity',
      icon: <Zap className="h-4 w-4" />,
      included: billsIncluded,
      price: billsIncluded ? 0 : 50
    },
    {
      name: 'Internet',
      icon: <Wifi className="h-4 w-4" />,
      included: true,
      price: 0
    },
    {
      name: 'Gas',
      icon: <Flame className="h-4 w-4" />,
      included: billsIncluded,
      price: billsIncluded ? 0 : 40
    }
  ];

  const additionalFees = [
    {
      name: 'Cleaning fee',
      description: 'One time fee charged for the monthly cleaning of the common areas.',
      price: 120
    },
    {
      name: 'Early or late hours for check-in and check-out',
      description: 'Optional fee charged for check-ins/check-outs in early or late hours.',
      price: 80,
      note: 'This fee applies for check-ins after 5pm in the week and on the weekend (100€) + if you check in at the apartment is 80€'
    },
    {
      name: 'Fixed bills fee',
      description: 'Monthly fee charged for fixed bills.',
      price: billsIncluded ? 0 : 70
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Services and expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fixed Monthly Bills */}
        <div>
          <h4 className="font-medium mb-4">Fixed Monthly Bills</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {utilities.map((utility, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {utility.icon}
                  <span className="font-medium">{utility.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {utility.included ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">Included in the price</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 text-sm">Not included in the price</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other fees */}
        <div>
          <h4 className="font-medium mb-4">Other fees</h4>
          <div className="space-y-4">
            {additionalFees.map((fee, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium">{fee.name}</h5>
                    <p className="text-sm text-muted-foreground mt-1">{fee.description}</p>
                    {fee.note && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Note from landlord: {fee.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className="font-semibold">{formatPrice(fee.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rental Conditions */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-4">Rental Conditions</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Minimum stay 125 nights</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Short term penalty: Under 153 days €80</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
