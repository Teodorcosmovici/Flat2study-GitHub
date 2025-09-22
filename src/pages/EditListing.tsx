import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Euro, Home, Camera, Calendar } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { ListingType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MultilingualInput } from '@/components/forms/MultilingualInput';

export default function EditListing() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  console.log('EditListing component loaded with ID:', id, 'Profile:', profile?.id);

  const [formData, setFormData] = useState({
    title: { en: '', it: '' },
    type: '' as ListingType | '',
    description: { en: '', it: '' },
    addressLine: '',
    city: '',
    country: '',
    rentMonthlyEUR: '',
    depositEUR: '',
    agencyFee: '',
    billsIncluded: false,
    furnished: false,
    bedrooms: '',
    bathrooms: '',
    floor: '',
    sizeSqm: '',
    amenities: [] as string[],
    availabilityDate: '',
    status: 'DRAFT'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication and authorization
  useEffect(() => {
    console.log('Auth check - User:', user, 'Profile:', profile, 'User type:', profile?.user_type, 'Loading:', loading);
    if (!loading && (!user || (profile?.user_type !== 'agency' && profile?.user_type !== 'private'))) {
      console.log('User not authorized for editing, redirecting to home');
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
        .select('*, title_multilingual, description_multilingual')
        .eq('id', id)
        .eq('agency_id', profile?.id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
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
        title: (data.title_multilingual as { en: string; it: string }) || { en: data.title as string || '', it: data.title as string || '' },
        type: (data.type as ListingType) || '',
        description: (data.description_multilingual as { en: string; it: string }) || { en: data.description as string || '', it: data.description as string || '' },
        addressLine: data.address_line || '',
        city: data.city || '',
        country: data.country || '',
        rentMonthlyEUR: data.rent_monthly_eur?.toString() || '',
        depositEUR: data.deposit_eur?.toString() || '',
        agencyFee: data.agency_fee || '',
        billsIncluded: data.bills_included || false,
        furnished: data.furnished || false,
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        floor: data.floor || '',
        sizeSqm: data.size_sqm?.toString() || '',
        amenities: Array.isArray(data.amenities) ? data.amenities.filter(item => typeof item === 'string') as string[] : [],
        availabilityDate: data.availability_date || '',
        status: data.status || 'DRAFT'
      });

      setUploadedImages(Array.isArray(data.images) ? data.images.filter(item => typeof item === 'string') as string[] : []);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      navigate('/my-listings');
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

    // No validation required - allow saving with any fields empty

    setIsSubmitting(true);

    try {
      const listingData = {
        title_multilingual: formData.title,
        title: formData.title.en || formData.title.it || null, // Keep backwards compatibility
        type: formData.type || null,
        description_multilingual: formData.description,
        description: formData.description.en || formData.description.it || null, // Keep backwards compatibility
        address_line: formData.addressLine || null,
        city: formData.city || null,
        country: formData.country || null,
        rent_monthly_eur: formData.rentMonthlyEUR ? parseInt(formData.rentMonthlyEUR) : null,
        deposit_eur: formData.depositEUR ? parseInt(formData.depositEUR) : null,
        bills_included: formData.billsIncluded,
        furnished: formData.furnished,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor: formData.floor || null,
        size_sqm: formData.sizeSqm ? parseInt(formData.sizeSqm) : null,
        amenities: formData.amenities,
        availability_date: formData.availabilityDate || null,
        agency_fee: formData.agencyFee || null,
        images: uploadedImages,
        status: formData.status,
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

      navigate('/my-listings');
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
    'Garden', 'Gym', 'Swimming Pool', 'Air Conditioning', 'Heating'
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

  // Show access denied for non-agency users
  if (user && profile?.user_type !== 'agency') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/my-listings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Listings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Listing</h1>
            <p className="text-muted-foreground">Update your property information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Status Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultilingualInput
                  label="Property Title"
                  value={formData.title}
                  onChange={(value) => setFormData({...formData, title: value})}
                  placeholder="e.g., Cozy Studio Near University"
                />
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type</Label>
                  <Select value={formData.type} onValueChange={(value: ListingType) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <MultilingualInput
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({...formData, description: value})}
                type="textarea"
                placeholder="Describe your property..."
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Property Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images">Upload Images</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Uploading images...</p>}
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Property ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Pricing & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent (EUR)</Label>
                  <Input
                    id="rent"
                    type="number"
                    placeholder="800"
                    value={formData.rentMonthlyEUR}
                    onChange={(e) => setFormData({...formData, rentMonthlyEUR: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit (EUR)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    placeholder="1600"
                    value={formData.depositEUR}
                    onChange={(e) => setFormData({...formData, depositEUR: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="1"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    placeholder="2nd"
                    value={formData.floor}
                    onChange={(e) => setFormData({...formData, floor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqm)</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="45"
                    value={formData.sizeSqm}
                    onChange={(e) => setFormData({...formData, sizeSqm: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyFee">Agency Fee</Label>
                <Input
                  id="agencyFee"
                  placeholder="e.g., 500 EUR or 1 month rent"
                  value={formData.agencyFee}
                  onChange={(e) => setFormData({...formData, agencyFee: e.target.value})}
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="furnished"
                    checked={formData.furnished}
                    onCheckedChange={(checked) => setFormData({...formData, furnished: checked as boolean})}
                  />
                  <Label htmlFor="furnished">Furnished</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bills"
                    checked={formData.billsIncluded}
                    onCheckedChange={(checked) => setFormData({...formData, billsIncluded: checked as boolean})}
                  />
                  <Label htmlFor="bills">Bills Included</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    <Label htmlFor={amenity}>{amenity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="availability">Available From</Label>
                <Input
                  id="availability"
                  type="date"
                  value={formData.availabilityDate}
                  onChange={(e) => setFormData({...formData, availabilityDate: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="hero-gradient text-white border-0 flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Listing'}
            </Button>
            <Link to="/landlord-dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}