import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BasicInfoStepProps {
  data: {
    address_line: string;
    address_line2?: string;
    postcode: string;
    city: string;
    country: string;
    furnished: boolean;
  };
  updateData: (newData: any) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, updateData }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="address_line">{t('createListing.propertyAddress')} *</Label>
          <Input
            id="address_line"
            value={data.address_line}
            onChange={(e) => updateData({ address_line: e.target.value })}
            placeholder={t('createListing.propertyAddressPlaceholder')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address_line2">{t('createListing.addressLine2')}</Label>
          <Input
            id="address_line2"
            value={data.address_line2 || ''}
            onChange={(e) => updateData({ address_line2: e.target.value })}
            placeholder={t('createListing.addressLine2Placeholder')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="postcode">{t('createListing.postcode')} *</Label>
          <Input
            id="postcode"
            value={data.postcode}
            onChange={(e) => updateData({ postcode: e.target.value })}
            placeholder={t('createListing.postcodePlaceholder')}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">{t('createListing.city')} *</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
              placeholder={t('createListing.cityPlaceholder')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="country">{t('createListing.country')} *</Label>
            <Input
              id="country"
              value={data.country}
              onChange={(e) => updateData({ country: e.target.value })}
              placeholder={t('createListing.countryPlaceholder')}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>{t('createListing.isFurnished')} *</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={data.furnished ? "default" : "outline"}
              onClick={() => updateData({ furnished: true })}
              className={cn(
                "flex-1",
                data.furnished && "bg-primary text-primary-foreground"
              )}
            >
              {t('createListing.yes')}
            </Button>
            <Button
              type="button"
              variant={!data.furnished ? "outline" : "outline"}
              onClick={() => updateData({ furnished: false })}
              className={cn(
                "flex-1",
                !data.furnished && "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              )}
            >
              {t('createListing.no')}
            </Button>
          </div>
          
          {!data.furnished && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('createListing.furnishedRequired')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>{t('createListing.requiredFields')}</p>
      </div>
    </div>
  );
};