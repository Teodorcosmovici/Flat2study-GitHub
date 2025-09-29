import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import step components
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PropertyDetailsStep } from './steps/PropertyDetailsStep';
import { AmenitiesRulesStep } from './steps/AmenitiesRulesStep';
import { PricingAvailabilityStep } from './steps/PricingAvailabilityStep';
import { UtilityCostsStep } from './steps/UtilityCostsStep';
import { PhotosStep } from './steps/PhotosStep';
import { ReviewStep } from './steps/ReviewStep';

interface ListingData {
  // Basic Info
  address_line: string;
  address_line2?: string;
  postcode: string;
  city: string;
  country: string;
  furnished: boolean;
  
  // Property Details
  type: 'entire_property' | 'studio' | 'room_shared' | 'bedspace_shared';
  bedrooms?: number;
  bathrooms: number;
  total_bedrooms?: number; // for shared rooms
  total_bathrooms?: number; // for shared rooms
  housemates_gender?: 'male' | 'female' | 'mixed';
  size_sqm: number;
  
  // Amenities & Rules
  amenities: string[];
  description: string;
  rules: string[];
  
  // Pricing & Availability
  rent_basis: 'daily' | 'semi_monthly' | 'monthly';
  rent_amount: number;
  deposit: 'none' | '1_month' | '1.5_months' | '2_months' | '3_months';
  landlord_admin_fee?: number;
  min_stay_months?: number;
  max_stay_months?: number;
  available_from: string;
  
  // Utility Costs
  electricityIncluded: boolean;
  electricityCostEur: number;
  gasIncluded: boolean;
  gasCostEur: number;
  waterIncluded: boolean;
  waterCostEur: number;
  internetIncluded: boolean;
  internetCostEur: number;
  
  // Photos
  images: string[];
}

const STEPS = [
  'createListing.basicInfo',
  'createListing.propertyDetails', 
  'createListing.amenitiesRules',
  'createListing.pricingAvailability',
  'createListing.utilityCosts',
  'createListing.photos',
  'createListing.review'
];

export const ListingWizard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [listingData, setListingData] = useState<ListingData>({
    address_line: '',
    address_line2: '',
    postcode: '',
    city: '',
    country: '',
    furnished: false,
    type: 'entire_property',
    bathrooms: 1,
    size_sqm: 0,
    amenities: [],
    description: '',
    rules: [],
    rent_basis: 'monthly',
    rent_amount: 0,
    deposit: '1_month',
    available_from: '',
    electricityIncluded: true,
    electricityCostEur: 0,
    gasIncluded: true,
    gasCostEur: 0,
    waterIncluded: true,
    waterCostEur: 0,
    internetIncluded: true,
    internetCostEur: 0,
    images: []
  });

  const updateListingData = (newData: Partial<ListingData>) => {
    setListingData(prev => ({ ...prev, ...newData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return listingData.address_line && listingData.postcode && listingData.city && listingData.country && listingData.furnished;
      case 1: // Property Details
        return listingData.bathrooms > 0 && listingData.size_sqm > 0;
      case 2: // Amenities & Rules
        return listingData.description.trim().length > 0;
      case 3: // Pricing & Availability
        return listingData.rent_amount > 0 && listingData.available_from;
      case 4: // Utility Costs
        return true; // All utility fields have defaults
      case 5: // Photos
        return listingData.images.length >= 4;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    try {
      // Calculate monthly rent in EUR based on rent basis
      let monthly_rent = listingData.rent_amount;
      if (listingData.rent_basis === 'daily') {
        monthly_rent = listingData.rent_amount * 30;
      } else if (listingData.rent_basis === 'semi_monthly') {
        monthly_rent = listingData.rent_amount * 2;
      }

      // Calculate deposit amount
      let deposit_amount = 0;
      if (listingData.deposit !== 'none') {
        const multiplier = {
          '1_month': 1,
          '1.5_months': 1.5,
          '2_months': 2,
          '3_months': 3
        }[listingData.deposit];
        deposit_amount = monthly_rent * multiplier;
      }

      const { data, error } = await supabase
        .from('listings')
        .insert({
          agency_id: profile.id,
          title: `${
            listingData.type === 'studio' 
              ? t('createListing.studio') 
              : listingData.type === 'room_shared' 
                ? t('createListing.roomShared')
                : listingData.type === 'bedspace_shared'
                  ? t('createListing.bedspaceShared')
                  : t('createListing.entireProperty')
          } in ${listingData.address_line}`,
          type: listingData.type === 'entire_property' ? 'apartment' : listingData.type === 'studio' ? 'studio' : listingData.type === 'bedspace_shared' ? 'bedspace' : 'room',
          description: listingData.description,
          address_line: listingData.address_line,
          postcode: listingData.postcode,
          city: listingData.city,
          country: listingData.country,
          lat: 0, // You'll need to geocode the address
          lng: 0, // You'll need to geocode the address
          rent_monthly_eur: Math.round(monthly_rent),
          deposit_eur: Math.round(deposit_amount),
          landlord_admin_fee: listingData.landlord_admin_fee || null,
          bills_included: listingData.electricityIncluded && listingData.gasIncluded && listingData.waterIncluded && listingData.internetIncluded,
          electricity_included: listingData.electricityIncluded,
          electricity_cost_eur: listingData.electricityCostEur,
          gas_included: listingData.gasIncluded,
          gas_cost_eur: listingData.gasCostEur,
          water_included: listingData.waterIncluded,
          water_cost_eur: listingData.waterCostEur,
          internet_included: listingData.internetIncluded,
          internet_cost_eur: listingData.internetCostEur,
          furnished: listingData.furnished,
          bedrooms: listingData.bedrooms || (listingData.type === 'studio' ? 0 : 1),
          bathrooms: listingData.bathrooms,
          total_bedrooms: listingData.total_bedrooms,
          total_bathrooms: listingData.total_bathrooms,
          housemates_gender: listingData.housemates_gender,
          size_sqm: listingData.size_sqm,
          amenities: listingData.amenities,
          house_rules: listingData.rules,
          availability_date: listingData.available_from,
          images: listingData.images,
          status: 'DRAFT', // Set to DRAFT initially
          review_status: 'pending_review', // Always requires admin review
          minimum_stay_days: (listingData.min_stay_months || 1) * 30,
          maximum_stay_days: listingData.max_stay_months ? listingData.max_stay_months * 30 : 365,
        });

      if (error) throw error;

      toast({
        title: t('createListing.submittedForReview'),
        description: t('createListing.submittedDescription'),
      });

      navigate('/landlord-dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: t('createListing.error'),
        description: t('createListing.errorDescription'),
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={listingData} updateData={updateListingData} />;
      case 1:
        return <PropertyDetailsStep data={listingData} updateData={updateListingData} />;
      case 2:
        return <AmenitiesRulesStep data={listingData} updateData={updateListingData} />;
      case 3:
        return <PricingAvailabilityStep data={listingData} updateData={updateListingData} />;
      case 4:
        return <UtilityCostsStep data={listingData} updateData={updateListingData} />;
      case 5:
        return <PhotosStep data={listingData} updateData={updateListingData} />;
      case 6:
        return <ReviewStep data={listingData} onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('createListing.title')}</h1>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {t('createListing.step')} {currentStep + 1} {t('createListing.of')} {STEPS.length}: {t(STEPS[currentStep])}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% {t('createListing.complete')}
            </span>
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(STEPS[currentStep])}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
          
          {currentStep < STEPS.length - 1 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? () => navigate('/landlord-dashboard') : handleBack}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('createListing.back')}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {t('createListing.next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          
          {currentStep === STEPS.length - 1 && (
            <div className="flex justify-start mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('createListing.back')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};