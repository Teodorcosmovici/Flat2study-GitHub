import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface UtilityCostsStepProps {
  data: {
    electricity: 'included' | number;
    gas: 'included' | number;
    water: 'included' | number;
    internet: 'included' | number;
  };
  updateData: (newData: any) => void;
}

export const UtilityCostsStep: React.FC<UtilityCostsStepProps> = ({ data, updateData }) => {
  const updateUtility = (utility: string, value: 'included' | 'estimate') => {
    if (value === 'included') {
      updateData({ [utility]: 'included' });
    } else {
      updateData({ [utility]: 0 });
    }
  };

  const updateUtilityCost = (utility: string, cost: number) => {
    updateData({ [utility]: cost });
  };

  const renderUtilitySection = (
    utility: string,
    label: string,
    value: 'included' | number
  ) => (
    <div key={utility} className="space-y-3 p-4 border rounded-lg">
      <Label className="text-base font-medium">{label}</Label>
      <RadioGroup
        value={value === 'included' ? 'included' : 'estimate'}
        onValueChange={(val) => updateUtility(utility, val as 'included' | 'estimate')}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="included" id={`${utility}-included`} />
          <Label htmlFor={`${utility}-included`} className="font-normal">
            Included in rent
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="estimate" id={`${utility}-estimate`} />
          <Label htmlFor={`${utility}-estimate`} className="font-normal">
            Estimate monthly cost
          </Label>
        </div>
      </RadioGroup>
      
      {value !== 'included' && (
        <div className="ml-6">
          <Input
            type="number"
            min="0"
            step="5"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => updateUtilityCost(utility, parseFloat(e.target.value) || 0)}
            placeholder="Monthly cost in EUR"
            className="w-48"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Utility Costs</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Specify whether utilities are included in the rent or provide estimated monthly costs.
        </p>
      </div>

      <div className="space-y-4">
        {renderUtilitySection('electricity', 'Electricity', data.electricity)}
        {renderUtilitySection('gas', 'Gas', data.gas)}
        {renderUtilitySection('water', 'Water', data.water)}
        {renderUtilitySection('internet', 'Internet', data.internet)}
      </div>
    </div>
  );
};