import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, Home, Euro, Calendar, Zap } from 'lucide-react';

interface ReviewStepProps {
  data: any;
  onSubmit: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onSubmit }) => {
  const formatDeposit = () => {
    if (data.deposit === 'none') return 'No deposit required';
    return `${data.deposit.replace('_', ' ').replace('months', 'month(s) rent')}`;
  };

  const formatRent = () => {
    const basis = data.rent_basis === 'semi_monthly' ? 'every 2 weeks' : 
                  data.rent_basis === 'daily' ? 'per day' : 'per month';
    return `€${data.rent_amount} ${basis}`;
  };

  const formatUtilities = () => {
    const utilities = [
      { name: 'Electricity', value: data.electricity },
      { name: 'Gas', value: data.gas },
      { name: 'Water', value: data.water },
      { name: 'Internet', value: data.internet }
    ];

    const included = utilities.filter(u => u.value === 'included').map(u => u.name);
    const estimated = utilities.filter(u => u.value !== 'included');

    return { included, estimated };
  };

  const utils = formatUtilities();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-2xl font-bold">Review Your Listing</h2>
          <p className="text-muted-foreground">
            Please review all information before submitting your listing for approval.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Address:</strong> {data.address_line}</p>
              {data.address_line2 && <p><strong>Address Line 2:</strong> {data.address_line2}</p>}
              <p><strong>Postcode:</strong> {data.postcode}</p>
              <div className="flex items-center gap-2">
                <Badge variant={data.furnished ? "default" : "destructive"}>
                  {data.furnished ? "Furnished" : "Unfurnished"}
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
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Type:</strong> {data.type.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Size:</strong> {data.size_sqm} sqm</p>
                <p><strong>Bathrooms:</strong> {data.bathrooms}</p>
              </div>
              <div>
                {data.bedrooms && <p><strong>Bedrooms:</strong> {data.bedrooms}</p>}
                {data.total_bedrooms && <p><strong>Total Bedrooms:</strong> {data.total_bedrooms}</p>}
                {data.housemates_gender && <p><strong>Housemates:</strong> {data.housemates_gender}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Pricing & Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Rent:</strong> {formatRent()}</p>
              <p><strong>Deposit:</strong> {formatDeposit()}</p>
              {data.min_stay_months && <p><strong>Minimum Stay:</strong> {data.min_stay_months} month(s)</p>}
              {data.max_stay_months && <p><strong>Maximum Stay:</strong> {data.max_stay_months} month(s)</p>}
              <p><strong>Available From:</strong> {new Date(data.available_from).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Utilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Utilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {utils.included.length > 0 && (
                <div>
                  <p className="font-medium text-green-600 mb-1">Included in rent:</p>
                  <div className="flex flex-wrap gap-1">
                    {utils.included.map((util) => (
                      <Badge key={util} variant="secondary">{util}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {utils.estimated.length > 0 && (
                <div>
                  <p className="font-medium text-orange-600 mb-1">Estimated monthly costs:</p>
                  <div className="space-y-1">
                    {utils.estimated.map((util) => (
                      <p key={util.name} className="text-sm">
                        {util.name}: €{util.value}/month
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
            <CardTitle>Amenities & Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Description:</p>
                <p className="text-sm text-muted-foreground">{data.description}</p>
              </div>
              
              {data.amenities.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.rules.length > 0 && (
                <div>
                  <p className="font-medium mb-2">House Rules:</p>
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
            <CardTitle>Photos ({data.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {data.images.slice(0, 8).map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`Property photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
              {data.images.length > 8 && (
                <div className="w-full h-20 bg-muted rounded flex items-center justify-center text-sm">
                  +{data.images.length - 8} more
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
              <h3 className="font-medium text-blue-900">Ready to Submit</h3>
              <p className="text-sm text-blue-700 mt-1">
                During the next 24 hours, our Trust & Safety department will review your listing. 
                If everything is correct, it will appear on the website automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onSubmit} size="lg" className="px-8">
          Submit for Review
        </Button>
      </div>
    </div>
  );
};