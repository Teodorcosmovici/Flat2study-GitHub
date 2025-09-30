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
import { useLanguage } from '@/contexts/LanguageContext';

export const HowToBook: React.FC = () => {
  const { t } = useLanguage();
  
  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      titleKey: "listing.howToBook.step1.title",
      descKey: "listing.howToBook.step1.desc",
      highlighted: false
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      titleKey: "listing.howToBook.step2.title",
      descKey: "listing.howToBook.step2.desc",
      highlighted: true
    },
    {
      icon: <Clock className="h-6 w-6" />,
      titleKey: "listing.howToBook.step3.title",
      descKey: "listing.howToBook.step3.desc",
      highlighted: false
    },
    {
      icon: <Key className="h-6 w-6" />,
      titleKey: "listing.howToBook.step4.title",
      descKey: "listing.howToBook.step4.desc",
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
        <CardTitle>{t('listing.howToBook')}</CardTitle>
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
                <h4 className="font-semibold mb-2">{t(step.titleKey)}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Remember notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Search className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">{t('listing.howToBook.remember')}</h5>
            <p className="text-sm text-blue-700">
              {t('listing.howToBook.rememberDesc')}
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};