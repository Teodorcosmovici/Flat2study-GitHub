import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Euro, Zap, Droplet, Wifi, Flame, Calendar } from 'lucide-react';

interface ServicesAndExpensesProps {
  rentMonthlyEur: number;
  depositEur?: number;
  utilities: {
    electricity: { included: boolean; cost: number };
    gas: { included: boolean; cost: number };
    water: { included: boolean; cost: number };
    internet: { included: boolean; cost: number };
  };
}

export const ServicesAndExpenses: React.FC<ServicesAndExpensesProps> = ({
  rentMonthlyEur,
  depositEur,
  utilities
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const utilityList = [
    {
      name: 'Water',
      icon: <Droplet className="h-4 w-4" />,
      included: utilities.water.included,
      price: utilities.water.cost
    },
    {
      name: 'Electricity',
      icon: <Zap className="h-4 w-4" />,
      included: utilities.electricity.included,
      price: utilities.electricity.cost
    },
    {
      name: 'Internet',
      icon: <Wifi className="h-4 w-4" />,
      included: utilities.internet.included,
      price: utilities.internet.cost
    },
    {
      name: 'Gas',
      icon: <Flame className="h-4 w-4" />,
      included: utilities.gas.included,
      price: utilities.gas.cost
    }
  ];

  // Calculate if any utilities are not included
  const hasNonIncludedUtilities = !utilities.electricity.included || 
                                  !utilities.gas.included || 
                                  !utilities.water.included || 
                                  !utilities.internet.included;

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
      price: hasNonIncludedUtilities ? 70 : 0
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
        {/* Security Deposit */}
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h5 className="font-medium text-blue-900">Security deposit</h5>
              <p className="text-sm text-blue-700 mt-1">
                Refundable payment to be made directly to Landlord, which should be refunded if you meet all the rental conditions with our platform
              </p>
            </div>
            <div className="text-right ml-4">
              <span className="font-semibold text-blue-900">{formatPrice(depositEur || 0)}</span>
            </div>
          </div>
        </div>

        {/* Fixed Monthly Bills */}
        <div>
          <h4 className="font-medium mb-4">Fixed Monthly Bills</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {utilityList.map((utility, index) => (
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
                      <span className="text-red-600 text-sm">
                        Not included - Est. {formatPrice(utility.price)}/month
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
