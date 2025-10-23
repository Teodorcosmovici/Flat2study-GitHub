import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface PricingAvailabilityStepProps {
  data: {
    rent_amount: number;
    deposit: number;
    landlord_admin_fee?: number;
    min_stay_months?: number;
    max_stay_months?: number;
    available_from: string;
  };
  updateData: (newData: any) => void;
}

export const PricingAvailabilityStep: React.FC<PricingAvailabilityStepProps> = ({ data, updateData }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="rent_amount">
          {t('createListing.rentAmount')} *
        </Label>
        <Input
          id="rent_amount"
          type="number"
          min="0"
          step="1"
          value={data.rent_amount || ''}
          onChange={(e) => updateData({ rent_amount: parseFloat(e.target.value) || 0 })}
          placeholder={t('createListing.enterRentAmount')}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="deposit">
          {t('createListing.securityDeposit')} *
        </Label>
        <Input
          id="deposit"
          type="number"
          min="0"
          step="1"
          value={data.deposit || ''}
          onChange={(e) => updateData({ deposit: parseFloat(e.target.value) || 0 })}
          placeholder={t('createListing.enterDepositAmount')}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the security deposit amount in EUR
        </p>
        
        {data.deposit === 0 && (
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('createListing.depositBonus')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Label htmlFor="landlord_admin_fee">
          {t('createListing.landlordAdminFee')}
        </Label>
        <Input
          id="landlord_admin_fee"
          type="number"
          min="0"
          step="1"
          value={data.landlord_admin_fee || ''}
          onChange={(e) => updateData({ landlord_admin_fee: parseFloat(e.target.value) || undefined })}
          placeholder={t('createListing.enterAdminFee')}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('createListing.adminFeeDescription')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_stay_months">{t('createListing.minimumStay')}</Label>
          <Input
            id="min_stay_months"
            type="number"
            min="1"
            value={data.min_stay_months || ''}
            onChange={(e) => updateData({ min_stay_months: parseInt(e.target.value) || undefined })}
            placeholder={t('createListing.minimumStayPlaceholder')}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="max_stay_months">{t('createListing.maximumStay')}</Label>
          <Input
            id="max_stay_months"
            type="number"
            min="1"
            value={data.max_stay_months || ''}
            onChange={(e) => updateData({ max_stay_months: parseInt(e.target.value) || undefined })}
            placeholder={t('createListing.maximumStayPlaceholder')}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('createListing.maximumStayDescription')}
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="available_from">{t('createListing.availableFrom')} *</Label>
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