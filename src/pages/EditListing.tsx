import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, MapPin, Euro, Home, Camera, Calendar } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function EditListing() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    // Address fields
    addressLine: '',
    addressLine2: '',
    postcode: '',
    
    // Property type and details
    type: 'entire_property' as 'entire_property' | 'studio' | 'room_shared',
    bedrooms: '',
    bathrooms: '',
    totalBedrooms: '', // for shared rooms
    totalBathrooms: '', // for shared rooms
    housematesGender: '' as 'male' | 'female' | 'mixed' | '',
    sizeSqm: '',
    
    // Description and amenities
    description: '',
    amenities: [] as string[],
    rules: [] as string[],
    
    // Pricing
    rentBasis: 'monthly' as 'daily' | 'semi_monthly' | 'monthly',
    rentAmount: '',
    deposit: '1_month' as 'none' | '1_month' | '1.5_months' | '2_months' | '3_months',
    minStayMonths: '',
    maxStayMonths: '',
    availableFrom: '',
    
    // Utilities
    electricity: 'included' as 'included' | number,
    gas: 'included' as 'included' | number,
    water: 'included' as 'included' | number,
    internet: 'included' as 'included' | number
  });

  // Generate title based on property type
  const generateTitle = (type: string, bedrooms?: string, bathrooms?: string) => {
    switch (type) {
      case 'entire_property':
        const bedroomCount = bedrooms || '1';
        const bathroomCount = bathrooms || '1';
        return `${bedroomCount} bedroom${parseInt(bedroomCount) > 1 ? 's' : ''}, ${bathroomCount} bathroom${parseInt(bathroomCount) > 1 ? 's' : ''} apartment`;
      case 'studio':
        const studioBathrooms = bathrooms || '1';
        return `Studio with ${studioBathrooms} bathroom${parseInt(studioBathrooms) > 1 ? 's' : ''}`;
      case 'room_shared':
        return 'Room in shared apartment';
      default:
        return 'Rental property';
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication and authorization
  useEffect(() => {
    if (!loading && (!user || (profile?.user_type !== 'agency' && profile?.user_type !== 'private'))) {
      navigate('/');
    }
  }, [user, profile, loading, navigate]);

  // Fetch listing data
  useEffect(() => {
    if (id && profile?.id) {
      fetchListing();
    }
  }, [id, profile]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('agency_id', profile?.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load listing or you don't have permission to edit this listing",
          variant: "destructive",
        });
        navigate('/landlord-dashboard');
        return;
      }

      // Populate form with existing data
      setFormData({
        addressLine: data.address_line || '',
        addressLine2: '', // Not stored in current schema
        postcode: '', // Not stored in current schema
        type: data.type === 'apartment' ? 'entire_property' : data.type === 'studio' ? 'studio' : 'room_shared',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        totalBedrooms: '', // Not stored separately
        totalBathrooms: '', // Not stored separately
        housematesGender: '', // Not stored in current schema
        sizeSqm: data.size_sqm?.toString() || '',
        description: data.description || '',
        amenities: Array.isArray(data.amenities) ? data.amenities.filter(item => typeof item === 'string') as string[] : [],
        rules: [], // Not stored in current schema
        rentBasis: 'monthly', // Default
        rentAmount: data.rent_monthly_eur?.toString() || '',
        deposit: '1_month', // Default
        minStayMonths: data.minimum_stay_days ? Math.round(data.minimum_stay_days / 30).toString() : '',
        maxStayMonths: data.maximum_stay_days ? Math.round(data.maximum_stay_days / 30).toString() : '',
        availableFrom: data.availability_date || '',
        electricity: 'included',
        gas: 'included',
        water: 'included',
        internet: 'included'
      });

      setUploadedImages(Array.isArray(data.images) ? data.images.filter(item => typeof item === 'string') as string[] : []);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      navigate('/landlord-dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        newImages.push(data.publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setUploadedImages([...uploadedImages, ...newImages]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || !id) {
      toast({
        title: "Error",
        description: "User profile or listing ID not found",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate deposit amount
      let depositAmount = 0;
      if (formData.deposit !== 'none' && formData.rentAmount) {
        const multiplier = {
          '1_month': 1,
          '1.5_months': 1.5,
          '2_months': 2,
          '3_months': 3
        }[formData.deposit];
        depositAmount = parseInt(formData.rentAmount) * multiplier;
      }

      // Generate title based on current form data
      const title = generateTitle(formData.type, formData.bedrooms, formData.bathrooms);

      const listingData = {
        title: title,
        address_line: formData.addressLine || null,
        postcode: formData.postcode || null,
        type: formData.type === 'entire_property' ? 'apartment' : formData.type === 'studio' ? 'studio' : 'room',
        description: formData.description || null,
        rent_monthly_eur: formData.rentAmount ? parseInt(formData.rentAmount) : null,
        deposit_eur: depositAmount || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        total_bedrooms: formData.totalBedrooms ? parseInt(formData.totalBedrooms) : null,
        total_bathrooms: formData.totalBathrooms ? parseInt(formData.totalBathrooms) : null,
        housemates_gender: formData.housematesGender || null,
        size_sqm: formData.sizeSqm ? parseInt(formData.sizeSqm) : null,
        amenities: formData.amenities,
        house_rules: formData.rules,
        availability_date: formData.availableFrom || null,
        minimum_stay_days: formData.minStayMonths ? parseInt(formData.minStayMonths) * 30 : null,
        maximum_stay_days: formData.maxStayMonths ? parseInt(formData.maxStayMonths) * 30 : null,
        images: uploadedImages,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', id)
        .eq('agency_id', profile.id);

      if (error) {
        console.error('Error updating listing:', error);
        toast({
          title: "Error",
          description: `Failed to update listing: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your listing has been updated successfully.",
      });

      navigate('/landlord-dashboard');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonAmenities = [
    'WiFi', 'Washing Machine', 'Dishwasher', 'Parking', 'Balcony', 
    'Garden', 'Gym', 'Swimming Pool', 'Air Conditioning', 'Heating',
    'Microwave', 'Oven', 'Refrigerator', 'TV', 'Desk', 'Wardrobe'
  ];

  const commonRules = [
    'No smoking', 'No pets', 'No parties', 'Quiet hours 10PM-8AM',
    'Clean common areas', 'No overnight guests', 'Shoes off indoors'
  ];

  // Show loading state while checking auth or fetching data
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading listing...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Allow both agency and private users; others will be redirected via useEffect
  if (user && (profile?.user_type !== 'agency' && profile?.user_type !== 'private')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/landlord-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Listing</h1>
            <p className="text-muted-foreground">Update your property information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={formData.addressLine}
                  onChange={(e) => setFormData({...formData, addressLine: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                <Input
                  id="address2"
                  placeholder="Apartment, suite, etc."
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="Postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Type & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Type & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Property Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value as typeof formData.type})}
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

              {formData.type === 'entire_property' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="1"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="1"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {formData.type === 'studio' && (
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                  />
                </div>
              )}

              {formData.type === 'room_shared' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_bedrooms">Total Bedrooms in Apartment</Label>
                      <Input
                        id="total_bedrooms"
                        type="number"
                        min="1"
                        value={formData.totalBedrooms}
                        onChange={(e) => setFormData({...formData, totalBedrooms: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_bathrooms">Total Bathrooms in Apartment</Label>
                      <Input
                        id="total_bathrooms"
                        type="number"
                        min="1"
                        value={formData.totalBathrooms}
                        onChange={(e) => setFormData({...formData, totalBathrooms: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Housemates Gender</Label>
                    <Select 
                      value={formData.housematesGender} 
                      onValueChange={(value) => setFormData({...formData, housematesGender: value as typeof formData.housematesGender})}
                    >
                      <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="size_sqm">Full Property Size (sqm)</Label>
                <Input
                  id="size_sqm"
                  type="number"
                  min="1"
                  value={formData.sizeSqm}
                  onChange={(e) => setFormData({...formData, sizeSqm: e.target.value})}
                  placeholder="Enter size in square meters"
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Description */}
          <Card>
            <CardHeader>
              <CardTitle>Property Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonAmenities.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({...formData, amenities: [...formData.amenities, amenity]});
                        } else {
                          setFormData({...formData, amenities: formData.amenities.filter(a => a !== amenity)});
                        }
                      }}
                    />
                    <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* House Rules */}
          <Card>
            <CardHeader>
              <CardTitle>House Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commonRules.map((rule) => (
                  <div key={rule} className="flex items-center space-x-2">
                    <Checkbox
                      id={rule}
                      checked={formData.rules.includes(rule)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({...formData, rules: [...formData.rules, rule]});
                        } else {
                          setFormData({...formData, rules: formData.rules.filter(r => r !== rule)});
                        }
                      }}
                    />
                    <Label htmlFor={rule} className="text-sm">{rule}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Pricing & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rent Basis</Label>
                <RadioGroup
                  value={formData.rentBasis}
                  onValueChange={(value) => setFormData({...formData, rentBasis: value as typeof formData.rentBasis})}
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

              <div className="space-y-2">
                <Label htmlFor="rent_amount">Rent Amount (EUR)</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({...formData, rentAmount: e.target.value})}
                  placeholder="Enter rent amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Security Deposit</Label>
                <Select 
                  value={formData.deposit} 
                  onValueChange={(value) => setFormData({...formData, deposit: value as typeof formData.deposit})}
                >
                  <SelectTrigger>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_stay_months">Minimum Stay (months)</Label>
                  <Input
                    id="min_stay_months"
                    type="number"
                    min="1"
                    value={formData.minStayMonths}
                    onChange={(e) => setFormData({...formData, minStayMonths: e.target.value})}
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stay_months">Maximum Stay (months)</Label>
                  <Input
                    id="max_stay_months"
                    type="number"
                    min="1"
                    value={formData.maxStayMonths}
                    onChange={(e) => setFormData({...formData, maxStayMonths: e.target.value})}
                    placeholder="Leave empty for no limit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Utility Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Utility Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['electricity', 'gas', 'water', 'internet'].map((utility) => (
                <div key={utility} className="space-y-3 p-4 border rounded-lg">
                  <Label className="text-base font-medium capitalize">{utility}</Label>
                  <RadioGroup
                    value={formData[utility as keyof typeof formData] === 'included' ? 'included' : 'estimate'}
                    onValueChange={(val) => {
                      if (val === 'included') {
                        setFormData({...formData, [utility]: 'included'});
                      } else {
                        setFormData({...formData, [utility]: 0});
                      }
                    }}
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
                  
                  {formData[utility as keyof typeof formData] !== 'included' && (
                    <div className="ml-6">
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={typeof formData[utility as keyof typeof formData] === 'number' ? formData[utility as keyof typeof formData] : ''}
                        onChange={(e) => setFormData({...formData, [utility]: parseFloat(e.target.value) || 0})}
                        placeholder="Monthly cost in EUR"
                        className="w-48"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <Label htmlFor="photos" className="cursor-pointer">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span>
                      {uploading ? 'Uploading...' : 'Choose Photos'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Select multiple photos at once. Supported formats: JPG, PNG, WebP
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium">
                      Uploaded Photos ({uploadedImages.length})
                    </p>
                    <span className={`text-sm ${uploadedImages.length >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
                      {uploadedImages.length >= 4 ? 'Minimum requirement met' : `${4 - uploadedImages.length} more needed`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Main Photo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}