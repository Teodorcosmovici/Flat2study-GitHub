import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface PricingAvailabilityStepProps {
  data: {
    rent_basis: 'daily' | 'semi_monthly' | 'monthly';
    rent_amount: number;
    deposit: 'none' | '1_month' | '1.5_months' | '2_months' | '3_months';
    min_stay_months?: number;
    max_stay_months?: number;
    available_from: string;
  };
  updateData: (newData: any) => void;
}

export const PricingAvailabilityStep: React.FC<PricingAvailabilityStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div>
        <Label>Rent Basis *</Label>
        <RadioGroup
          value={data.rent_basis}
          onValueChange={(value) => updateData({ rent_basis: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="daily" />
            <Label htmlFor="daily">Daily Basis</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="semi_monthly" id="semi_monthly" />
            <Label htmlFor="semi_monthly">Semi-Monthly Basis (Every 2 weeks)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="monthly" />
            <Label htmlFor="monthly">Monthly Basis</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="rent_amount">
          Rent Amount (EUR) *
          {data.rent_basis === 'daily' && ' - Per Day'}
          {data.rent_basis === 'semi_monthly' && ' - Per 2 Weeks'}
          {data.rent_basis === 'monthly' && ' - Per Month'}
        </Label>
        <Input
          id="rent_amount"
          type="number"
          min="0"
          step="50"
          value={data.rent_amount || ''}
          onChange={(e) => updateData({ rent_amount: parseFloat(e.target.value) || 0 })}
          placeholder="Enter rent amount"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Security Deposit *</Label>
        <Select 
          value={data.deposit} 
          onValueChange={(value) => updateData({ deposit: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select deposit amount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No deposit required</SelectItem>
            <SelectItem value="1_month">1 month rent</SelectItem>
            <SelectItem value="1.5_months">1.5 months rent</SelectItem>
            <SelectItem value="2_months">2 months rent</SelectItem>
            <SelectItem value="3_months">3 months rent</SelectItem>
          </SelectContent>
        </Select>
        
        {data.deposit === 'none' && (
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Properties without security deposit have +30% more bookings on average.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_stay_months">Minimum Stay (months)</Label>
          <Input
            id="min_stay_months"
            type="number"
            min="1"
            value={data.min_stay_months || ''}
            onChange={(e) => updateData({ min_stay_months: parseInt(e.target.value) || undefined })}
            placeholder="e.g., 1"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="max_stay_months">Maximum Stay (months)</Label>
          <Input
            id="max_stay_months"
            type="number"
            min="1"
            value={data.max_stay_months || ''}
            onChange={(e) => updateData({ max_stay_months: parseInt(e.target.value) || undefined })}
            placeholder="Leave empty for no limit"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty for no maximum stay limit
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="available_from">Available From *</Label>
        <Input
          id="available_from"
          type="date"
          value={data.available_from}
          onChange={(e) => updateData({ available_from: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1"
        />
      </div>
    </div>
  );
};