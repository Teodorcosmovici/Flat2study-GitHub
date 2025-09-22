import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  Key, 
  CheckCircle, 
  ShieldCheck,
  Eye,
  CreditCard,
  ChevronDown
} from 'lucide-react';

export const HowToBook: React.FC = () => {
  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Find your home 100% online",
      description: "With our platform, in-person visits are a thing of the past. Our team verifies the property to offer video tours and photos so you can view them online. We collect all the information you need to make your decision.",
      highlighted: false
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Make a booking request",
      description: "With just a few simple details you can make a request for the property. Remember, we won't charge you until the Landlord confirms.",
      highlighted: true
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Get an answer in 24h or less",
      description: "The Landlord has 24 hours to respond to your booking request. If they accept, your payment method will be charged and we will put you in contact with the Landlord. If they don't accept, no worries, you won't be charged and we'll help you find alternatives.",
      highlighted: false
    },
    {
      icon: <Key className="h-6 w-6" />,
      title: "Move in",
      description: "Arrange your move-in date, key collection and anything else directly with your Landlord. As an extra security step, we will only transfer the first month's rent to the Landlord 24 hours after you move in, unless you contact us with a problem.",
      highlighted: false
    }
  ];

  const guarantees = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Deposit protected",
      expandable: true
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Property verified by our team",
      expandable: true
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Some Bills included",
      expandable: true
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Verified landlord",
      expandable: true
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Platform guarantee",
      expandable: true
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "24 hours to check your new home",
      expandable: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                step.highlighted 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Remember notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Search className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Remember: you have 24h to check your new home</h5>
            <p className="text-sm text-blue-700">
              If the property is significantly different to what our listing promised, let us know within 
              24h since you move in, so we can help you.
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};