import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, Home, Euro, Calendar, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewStepProps {
  data: any;
  onSubmit: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onSubmit }) => {
  const { t } = useLanguage();
  
  const formatDeposit = () => {
    if (data.deposit === 'none') return t('review.noDepositRequired');
    return `${data.deposit.replace('_', ' ').replace('months', t('review.monthsRent'))}`;
  };

  const formatRent = () => {
    const basis = data.rent_basis === 'semi_monthly' ? t('review.every2Weeks') : 
                  data.rent_basis === 'daily' ? t('review.perDay') : t('review.perMonth');
    return `€${data.rent_amount} ${basis}`;
  };

  const formatUtilities = () => {
    const utilities = [
      { name: t('review.electricity'), value: data.electricity, cost: data.electricity_cost_eur },
      { name: t('review.gas'), value: data.gas, cost: data.gas_cost_eur },
      { name: t('review.water'), value: data.water, cost: data.water_cost_eur },
      { name: t('review.internet'), value: data.internet, cost: data.internet_cost_eur }
    ];

    const included = utilities.filter(u => u.value === 'included').map(u => u.name);
    const estimated = utilities.filter(u => u.value !== 'included' && u.cost);

    return { included, estimated };
  };

  const utils = formatUtilities();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-2xl font-bold">{t('review.reviewYourListing')}</h2>
          <p className="text-muted-foreground">
            {t('review.reviewDescription')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('review.propertyLocation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>{t('review.address')}:</strong> {data.address_line}</p>
              {data.address_line2 && <p><strong>{t('review.addressLine2')}:</strong> {data.address_line2}</p>}
              <p><strong>{t('review.postcode')}:</strong> {data.postcode}</p>
              <div className="flex items-center gap-2">
                <Badge variant={data.furnished ? "default" : "destructive"}>
                  {data.furnished ? t('review.furnished') : t('review.unfurnished')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {t('review.propertyDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>{t('review.type')}:</strong> {data.type.replace('_', ' ').toUpperCase()}</p>
                <p><strong>{t('review.size')}:</strong> {data.size_sqm} sqm</p>
                <p><strong>{t('review.bathrooms')}:</strong> {data.bathrooms}</p>
              </div>
              <div>
                {data.bedrooms && <p><strong>{t('review.bedrooms')}:</strong> {data.bedrooms}</p>}
                {data.total_bedrooms && <p><strong>{t('review.totalBedrooms')}:</strong> {data.total_bedrooms}</p>}
                {data.housemates_gender && <p><strong>{t('review.housemates')}:</strong> {data.housemates_gender}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {t('review.pricingTerms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>{t('review.rent')}:</strong> {formatRent()}</p>
              <p><strong>{t('review.deposit')}:</strong> {formatDeposit()}</p>
              {data.min_stay_months && <p><strong>{t('review.minimumStay')}:</strong> {data.min_stay_months} {t('review.months')}</p>}
              {data.max_stay_months && <p><strong>{t('review.maximumStay')}:</strong> {data.max_stay_months} {t('review.months')}</p>}
              <p><strong>{t('review.availableFrom')}:</strong> {new Date(data.available_from).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Utilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('review.utilities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {utils.included.length > 0 && (
                <div>
                  <p className="font-medium text-green-600 mb-1">{t('review.includedInRent')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {utils.included.map((util) => (
                      <Badge key={util} variant="secondary">{util}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {utils.estimated.length > 0 && (
                <div>
                  <p className="font-medium text-orange-600 mb-1">{t('review.estimatedMonthlyCosts')}:</p>
                  <div className="space-y-1">
                    {utils.estimated.map((util) => (
                      <p key={util.name} className="text-sm">
                        {util.name}: €{util.cost}/month
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amenities & Rules */}
        <Card>
          <CardHeader>
            <CardTitle>{t('review.amenitiesRules')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">{t('review.description')}:</p>
                <p className="text-sm text-muted-foreground">{data.description}</p>
              </div>
              
              {data.amenities.length > 0 && (
                <div>
                  <p className="font-medium mb-2">{t('review.amenities')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.rules.length > 0 && (
                <div>
                  <p className="font-medium mb-2">{t('review.houseRules')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.rules.map((rule: string) => (
                      <Badge key={rule} variant="outline">{rule}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>{t('review.photos')} ({data.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {data.images.slice(0, 8).map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`${t('review.propertyPhoto')} ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
              {data.images.length > 8 && (
                <div className="w-full h-20 bg-muted rounded flex items-center justify-center text-sm">
                  +{data.images.length - 8} {t('review.more')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">{t('review.readyToSubmit')}</h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('review.submissionInfo')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onSubmit} size="lg" className="px-8">
          {t('review.submitForReview')}
        </Button>
      </div>
    </div>
  );
};