import React from 'react';
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
              placeholder="Enter city"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={data.country}
              onChange={(e) => updateData({ country: e.target.value })}
              placeholder="Enter country"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Is the property furnished? *</Label>
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
              Yes
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
              No
            </Button>
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