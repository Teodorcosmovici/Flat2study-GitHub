import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PropertyDetailsStepProps {
  data: {
    type: 'entire_property' | 'studio' | 'room_shared';
    bedrooms?: number;
    bathrooms: number;
    total_bedrooms?: number;
    total_bathrooms?: number;
    housemates_gender?: 'male' | 'female' | 'mixed';
    size_sqm: number;
  };
  updateData: (newData: any) => void;
}

export const PropertyDetailsStep: React.FC<PropertyDetailsStepProps> = ({ data, updateData }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <Label>{t('createListing.propertyType')} *</Label>
        <RadioGroup
          value={data.type}
          onValueChange={(value) => updateData({ type: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="entire_property" id="entire_property" />
            <Label htmlFor="entire_property">{t('createListing.entireProperty')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="studio" id="studio" />
            <Label htmlFor="studio">{t('createListing.studio')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="room_shared" id="room_shared" />
            <Label htmlFor="room_shared">{t('createListing.roomShared')}</Label>
          </div>
        </RadioGroup>
      </div>

      {data.type === 'entire_property' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bedrooms">{t('createListing.numberOfBedrooms')} *</Label>
            <Input
              id="bedrooms"
              type="number"
              min="1"
              value={data.bedrooms || ''}
              onChange={(e) => updateData({ bedrooms: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bathrooms">{t('createListing.numberOfBathrooms')} *</Label>
            <Input
              id="bathrooms"
              type="number"
              min="1"
              value={data.bathrooms}
              onChange={(e) => updateData({ bathrooms: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {data.type === 'studio' && (
        <div>
          <Label htmlFor="bathrooms">{t('createListing.numberOfBathrooms')} *</Label>
          <Input
            id="bathrooms"
            type="number"
            min="1"
            value={data.bathrooms}
            onChange={(e) => updateData({ bathrooms: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>
      )}

      {data.type === 'room_shared' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_bedrooms">{t('createListing.totalBedroomsInApartment')} *</Label>
              <Input
                id="total_bedrooms"
                type="number"
                min="1"
                value={data.total_bedrooms || ''}
                onChange={(e) => updateData({ total_bedrooms: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="total_bathrooms">{t('createListing.totalBathroomsInApartment')} *</Label>
              <Input
                id="total_bathrooms"
                type="number"
                min="1"
                value={data.total_bathrooms || ''}
                onChange={(e) => updateData({ total_bathrooms: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>{t('createListing.housematesGender')} *</Label>
            <Select 
              value={data.housemates_gender} 
              onValueChange={(value) => updateData({ housemates_gender: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('createListing.selectHousematesGender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('createListing.maleOnly')}</SelectItem>
                <SelectItem value="female">{t('createListing.femaleOnly')}</SelectItem>
                <SelectItem value="mixed">{t('createListing.mixed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="size_sqm">{t('createListing.fullPropertySize')} *</Label>
        <Input
          id="size_sqm"
          type="number"
          min="1"
          value={data.size_sqm || ''}
          onChange={(e) => updateData({ size_sqm: parseInt(e.target.value) || 0 })}
          placeholder={t('createListing.enterSizeSquareMeters')}
          className="mt-1"
        />
      </div>
    </div>
  );
};