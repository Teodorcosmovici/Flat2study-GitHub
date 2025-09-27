import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface UtilityCostsStepProps {
  data: {
    electricityIncluded: boolean;
    electricityCostEur: number;
    gasIncluded: boolean;
    gasCostEur: number;
    waterIncluded: boolean;
    waterCostEur: number;
    internetIncluded: boolean;
    internetCostEur: number;
  };
  updateData: (newData: any) => void;
}

export const UtilityCostsStep: React.FC<UtilityCostsStepProps> = ({ data, updateData }) => {
  const updateUtility = (utility: string, value: 'included' | 'estimate') => {
    const includedField = `${utility}Included`;
    const costField = `${utility}CostEur`;
    
    if (value === 'included') {
      updateData({ 
        [includedField]: true,
        [costField]: 0
      });
    } else {
      updateData({ 
        [includedField]: false,
        [costField]: data[costField as keyof typeof data] || 0
      });
    }
  };

  const updateUtilityCost = (utility: string, cost: number) => {
    const costField = `${utility}CostEur`;
    updateData({ [costField]: cost });
  };

  const renderUtilitySection = (
    utility: string,
    label: string,
    included: boolean,
    cost: number
  ) => (
    <div key={utility} className="space-y-3 p-4 border rounded-lg">
      <Label className="text-base font-medium">{label}</Label>
      <RadioGroup
        value={included ? 'included' : 'estimate'}
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
      
      {!included && (
        <div className="ml-6">
          <Input
            type="number"
            min="0"
            step="5"
            value={cost}
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
        {renderUtilitySection('electricity', 'Electricity', data.electricityIncluded, data.electricityCostEur)}
        {renderUtilitySection('gas', 'Gas', data.gasIncluded, data.gasCostEur)}
        {renderUtilitySection('water', 'Water', data.waterIncluded, data.waterCostEur)}
        {renderUtilitySection('internet', 'Internet', data.internetIncluded, data.internetCostEur)}
      </div>
    </div>
  );
};