import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  
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
            {t('createListing.included')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="estimate" id={`${utility}-estimate`} />
          <Label htmlFor={`${utility}-estimate`} className="font-normal">
            {t('createListing.estimate')}
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
            placeholder={t('createListing.estimatedCost')}
            className="w-48"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">{t('createListing.utilityCosts')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('createListing.utilityCostsDescription')}
        </p>
      </div>

      <div className="space-y-4">
        {renderUtilitySection('electricity', t('createListing.electricity'), data.electricityIncluded, data.electricityCostEur)}
        {renderUtilitySection('gas', t('createListing.gas'), data.gasIncluded, data.gasCostEur)}
        {renderUtilitySection('water', t('createListing.water'), data.waterIncluded, data.waterCostEur)}
        {renderUtilitySection('internet', t('createListing.internet'), data.internetIncluded, data.internetCostEur)}
      </div>
    </div>
  );
};