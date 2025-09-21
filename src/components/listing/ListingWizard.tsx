import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  furnished: boolean;
  
  // Property Details
  type: 'entire_property' | 'studio' | 'room_shared';
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
  min_stay_months?: number;
  max_stay_months?: number;
  available_from: string;
  
  // Utility Costs
  electricity: 'included' | number;
  gas: 'included' | number;
  water: 'included' | number;
  internet: 'included' | number;
  
  // Photos
  images: string[];
}

const STEPS = [
  'Basic Information',
  'Property Details', 
  'Amenities & Rules',
  'Pricing & Availability',
  'Utility Costs',
  'Photos',
  'Review'
];

export const ListingWizard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [listingData, setListingData] = useState<ListingData>({
    address_line: '',
    address_line2: '',
    postcode: '',
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
    electricity: 'included',
    gas: 'included',
    water: 'included',
    internet: 'included',
    images: []
  });

  const updateListingData = (newData: Partial<ListingData>) => {
    setListingData(prev => ({ ...prev, ...newData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return listingData.address_line && listingData.postcode && listingData.furnished;
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
          title: `${listingData.type === 'studio' ? 'Studio' : listingData.type === 'room_shared' ? 'Room in Shared Property' : 'Entire Property'} in ${listingData.address_line}`,
          type: listingData.type === 'entire_property' ? 'apartment' : listingData.type === 'studio' ? 'studio' : 'room',
          description: listingData.description,
          address_line: listingData.address_line,
          city: 'City', // You might want to extract this from address
          country: 'Country', // You might want to extract this from address
          lat: 0, // You'll need to geocode the address
          lng: 0, // You'll need to geocode the address
          rent_monthly_eur: Math.round(monthly_rent),
          deposit_eur: Math.round(deposit_amount),
          bills_included: Object.values(listingData).every(util => util === 'included'),
          furnished: listingData.furnished,
          bedrooms: listingData.bedrooms || (listingData.type === 'studio' ? 0 : 1),
          bathrooms: listingData.bathrooms,
          size_sqm: listingData.size_sqm,
          amenities: listingData.amenities,
          availability_date: listingData.available_from,
          images: listingData.images,
          status: 'DRAFT', // Set to DRAFT initially
          review_status: 'pending_review', // Always requires admin review
          minimum_stay_days: (listingData.min_stay_months || 1) * 30,
          maximum_stay_days: listingData.max_stay_months ? listingData.max_stay_months * 30 : 365,
        });

      if (error) throw error;

      toast({
        title: "Listing Submitted for Review",
        description: "Your listing has been submitted to our admin team for review. You'll be notified once it's approved and published.",
      });

      navigate('/landlord-dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Failed to submit listing. Please try again.",
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
        <h1 className="text-3xl font-bold mb-4">Create New Listing</h1>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
              >
                Submit for Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};