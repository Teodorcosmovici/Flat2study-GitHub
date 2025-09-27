import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const AMENITIES_KEYS = [
  'wifi',
  'kitchen',
  'washingMachine',
  'dryer',
  'dishwasher',
  'airConditioning',
  'heating',
  'balcony',
  'terrace',
  'garden',
  'parking',
  'elevator',
  'swimmingPool',
  'gym',
  'concierge',
  'security',
  'tv',
  'desk',
  'wardrobe'
];

const RULES_KEYS = [
  'noSmoking',
  'noPets'
];

interface AmenitiesRulesStepProps {
  data: {
    amenities: string[];
    description: string;
    rules: string[];
  };
  updateData: (newData: any) => void;
}

export const AmenitiesRulesStep: React.FC<AmenitiesRulesStepProps> = ({ data, updateData }) => {
  const { t } = useLanguage();
  const handleAmenityChange = (amenityKey: string, checked: boolean) => {
    const amenityValue = t(`amenities.${amenityKey}`);
    const newAmenities = checked
      ? [...data.amenities, amenityValue]
      : data.amenities.filter(a => a !== amenityValue);
    updateData({ amenities: newAmenities });
  };

  const handleRuleChange = (ruleKey: string, checked: boolean) => {
    const ruleValue = t(`createListing.${ruleKey}`);
    const newRules = checked
      ? [...data.rules, ruleValue]
      : data.rules.filter(r => r !== ruleValue);
    updateData({ rules: newRules });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="description">{t('createListing.propertyDescription')} *</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder={t('createListing.propertyDescriptionPlaceholder')}
          className="mt-1 min-h-[120px]"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {t('createListing.minimumCharacters')} ({data.description.length}/50)
        </p>
      </div>

      <div>
        <Label>{t('createListing.amenities')}</Label>
        <p className="text-sm text-muted-foreground mb-3">
          {t('createListing.selectAmenitiesText')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES_KEYS.map((amenityKey) => {
            const amenityValue = t(`amenities.${amenityKey}`);
            return (
              <div key={amenityKey} className="flex items-center space-x-2">
                <Checkbox
                  id={amenityKey}
                  checked={data.amenities.includes(amenityValue)}
                  onCheckedChange={(checked) => handleAmenityChange(amenityKey, checked as boolean)}
                />
                <Label htmlFor={amenityKey} className="text-sm font-normal">
                  {amenityValue}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label>{t('createListing.houseRules')}</Label>
        <p className="text-sm text-muted-foreground mb-3">
          {t('createListing.selectRulesText')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RULES_KEYS.map((ruleKey) => {
            const ruleValue = t(`createListing.${ruleKey}`);
            return (
              <div key={ruleKey} className="flex items-center space-x-2">
                <Checkbox
                  id={ruleKey}
                  checked={data.rules.includes(ruleValue)}
                  onCheckedChange={(checked) => handleRuleChange(ruleKey, checked as boolean)}
                />
                <Label htmlFor={ruleKey} className="text-sm font-normal">
                  {ruleValue}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};