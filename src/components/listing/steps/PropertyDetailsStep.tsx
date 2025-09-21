import React from 'react';
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
  return (
    <div className="space-y-6">
      <div>
        <Label>Property Type *</Label>
        <RadioGroup
          value={data.type}
          onValueChange={(value) => updateData({ type: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="entire_property" id="entire_property" />
            <Label htmlFor="entire_property">Entire Property</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="studio" id="studio" />
            <Label htmlFor="studio">Studio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="room_shared" id="room_shared" />
            <Label htmlFor="room_shared">Room in a Shared Property</Label>
          </div>
        </RadioGroup>
      </div>

      {data.type === 'entire_property' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
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
            <Label htmlFor="bathrooms">Number of Bathrooms *</Label>
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
          <Label htmlFor="bathrooms">Number of Bathrooms *</Label>
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
              <Label htmlFor="total_bedrooms">Total Bedrooms in Apartment *</Label>
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
              <Label htmlFor="total_bathrooms">Total Bathrooms in Apartment *</Label>
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
            <Label>Housemates Gender *</Label>
            <Select 
              value={data.housemates_gender} 
              onValueChange={(value) => updateData({ housemates_gender: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select housemates gender preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male only</SelectItem>
                <SelectItem value="female">Female only</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="size_sqm">Full Property Size (sqm) *</Label>
        <Input
          id="size_sqm"
          type="number"
          min="1"
          value={data.size_sqm || ''}
          onChange={(e) => updateData({ size_sqm: parseInt(e.target.value) || 0 })}
          placeholder="Enter size in square meters"
          className="mt-1"
        />
      </div>
    </div>
  );
};