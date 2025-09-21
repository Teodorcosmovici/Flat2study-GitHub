import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BasicInfoStepProps {
  data: {
    address_line: string;
    address_line2?: string;
    postcode: string;
    furnished: boolean;
  };
  updateData: (newData: any) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="address_line">Property Address *</Label>
          <Input
            id="address_line"
            value={data.address_line}
            onChange={(e) => updateData({ address_line: e.target.value })}
            placeholder="Enter the full address"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
          <Input
            id="address_line2"
            value={data.address_line2 || ''}
            onChange={(e) => updateData({ address_line2: e.target.value })}
            placeholder="Apartment, suite, unit, building, floor, etc."
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={data.postcode}
            onChange={(e) => updateData({ postcode: e.target.value })}
            placeholder="Enter postcode"
            className="mt-1"
          />
        </div>

        <div className="space-y-3">
          <Label>Is the property furnished? *</Label>
          <div className="flex items-center space-x-3">
            <Switch
              id="furnished"
              checked={data.furnished}
              onCheckedChange={(checked) => updateData({ furnished: checked })}
            />
            <Label htmlFor="furnished" className="text-sm">
              {data.furnished ? 'Yes, furnished' : 'No, unfurnished'}
            </Label>
          </div>
          
          {!data.furnished && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only furnished properties can be listed on our platform. Please ensure your property is furnished before continuing.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* Required fields</p>
      </div>
    </div>
  );
};