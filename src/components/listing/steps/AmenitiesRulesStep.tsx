import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const AMENITIES = [
  'WiFi Internet',
  'Kitchen',
  'Washing Machine',
  'Dryer',
  'Dishwasher',
  'Air Conditioning',
  'Heating',
  'Balcony',
  'Terrace',
  'Garden',
  'Parking',
  'Elevator',
  'Swimming Pool',
  'Gym',
  'Concierge',
  'Security',
  'TV',
  'Desk',
  'Wardrobe'
];

const RULES = [
  'No Smoking',
  'No Pets'
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
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...data.amenities, amenity]
      : data.amenities.filter(a => a !== amenity);
    updateData({ amenities: newAmenities });
  };

  const handleRuleChange = (rule: string, checked: boolean) => {
    const newRules = checked
      ? [...data.rules, rule]
      : data.rules.filter(r => r !== rule);
    updateData({ rules: newRules });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="description">Property Description *</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Describe your property, its location, nearby amenities, transportation links, and what makes it special..."
          className="mt-1 min-h-[120px]"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Minimum 50 characters ({data.description.length}/50)
        </p>
      </div>

      <div>
        <Label>Amenities</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select all amenities available in your property
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={data.amenities.includes(amenity)}
                onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
              />
              <Label htmlFor={amenity} className="text-sm font-normal">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>House Rules</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select the rules that apply to your property
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RULES.map((rule) => (
            <div key={rule} className="flex items-center space-x-2">
              <Checkbox
                id={rule}
                checked={data.rules.includes(rule)}
                onCheckedChange={(checked) => handleRuleChange(rule, checked as boolean)}
              />
              <Label htmlFor={rule} className="text-sm font-normal">
                {rule}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};