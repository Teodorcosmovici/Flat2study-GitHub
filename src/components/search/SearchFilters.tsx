import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, ListingType } from '@/types';
import { universities, commonAmenities } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, X, Euro, MapPin, Home, Bed, Sofa, Wifi } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

export default function SearchFiltersComponent({ filters, onFiltersChange, className }: SearchFiltersProps) {
  const { t } = useLanguage();
  const [priceRange, setPriceRange] = useState([filters.priceMin || 400, filters.priceMax || 1500]);

  const listingTypes: { value: ListingType; label: string }[] = [
    { value: 'room', label: t('propertyType.room') },
    { value: 'studio', label: t('propertyType.studio') },
    { value: 'apartment', label: t('propertyType.apartment') }
  ];

  const handleTypeChange = (type: ListingType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked 
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    onFiltersChange({ ...filters, type: newTypes });
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter(a => a !== amenity);
    
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({ 
      ...filters, 
      priceMin: values[0], 
      priceMax: values[1] 
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setPriceRange([400, 1500]);
  };

  const getPriceLabel = () => {
    if (filters.priceMin || filters.priceMax) {
      return `€${filters.priceMin || 400} - €${filters.priceMax || 1500}`;
    }
    return t('filters.price');
  };

  const getTypeLabel = () => {
    if (filters.type && filters.type.length > 0) {
      if (filters.type.length === 1) {
        return listingTypes.find(t => t.value === filters.type![0])?.label || t('filters.type');
      }
      return `${filters.type.length} ${t('filters.types')}`;
    }
    return t('filters.type');
  };

  const getUniversityLabel = () => {
    if (filters.universityId) {
      const uni = universities.find(u => u.id === filters.universityId);
      return uni?.name || t('filters.university');
    }
    return t('filters.university');
  };

  const getBedroomsLabel = () => {
    if (filters.bedrooms) {
      return filters.bedrooms === 3 ? t('filters.bedroomsPlus') : `${filters.bedrooms} ${filters.bedrooms > 1 ? t('filters.bedroomsPlural') : t('filters.bedroom')}`;
    }
    return t('filters.bedrooms');
  };

  const getAmenitiesLabel = () => {
    if (filters.amenities && filters.amenities.length > 0) {
      if (filters.amenities.length === 1) {
        return filters.amenities[0];
      }
      return `${filters.amenities.length} ${t('filters.amenitiesCount')}`;
    }
    return t('filters.amenities');
  };

  const hasActiveFilters = () => {
    return (filters.priceMin !== undefined || filters.priceMax !== undefined) ||
           (filters.type && filters.type.length > 0) ||
           filters.bedrooms !== undefined ||
           filters.furnished !== undefined ||
           (filters.amenities && filters.amenities.length > 0) ||
           filters.universityId ||
           filters.availabilityDate;
  };

  return (
    <div className={`${className} bg-background`}>
      {/* Mobile: Vertical layout */}
      <div className="md:hidden flex flex-col gap-2 px-4 py-3">
        {/* Price Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.priceMin || filters.priceMax ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Euro className="h-4 w-4 mr-2" />
                {getPriceLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-4">
              <Label className="text-sm font-medium">{t('filters.priceRange')}</Label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={2000}
                  min={300}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>€{priceRange[0]}</span>
                  <span>€{priceRange[1]}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Property Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.type && filters.type.length > 0 ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                {getTypeLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.propertyType')}</Label>
              <div className="space-y-2">
                {listingTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={type.value}
                      checked={filters.type?.includes(type.value) || false}
                      onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                    />
                    <Label htmlFor={type.value} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Availability Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.availabilityDate ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span>{t('filters.availableFrom')}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.availableFrom')}</Label>
              <Input 
                type="date"
                value={filters.availabilityDate || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  availabilityDate: e.target.value || undefined 
                })}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* University Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.universityId ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {getUniversityLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.nearUniversity')}</Label>
              <Select 
                value={filters.universityId || 'any'} 
                onValueChange={(value) => onFiltersChange({ ...filters, universityId: value === 'any' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.selectUniversity')} />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-popover border shadow-lg">
                  <SelectItem value="any">{t('filters.anyUniversity')}</SelectItem>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bedrooms Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.bedrooms ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                {getBedroomsLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.bedrooms')}</Label>
              <Select 
                value={filters.bedrooms?.toString() || 'any'} 
                onValueChange={(value) => onFiltersChange({ 
                  ...filters, 
                  bedrooms: value === 'any' ? undefined : parseInt(value) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.any')} />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-popover border shadow-lg">
                  <SelectItem value="any">{t('filters.any')}</SelectItem>
                  <SelectItem value="1">1 {t('filters.bedroom')}</SelectItem>
                  <SelectItem value="2">2 {t('filters.bedroomsPlural')}</SelectItem>
                  <SelectItem value="3">{t('filters.bedroomsPlus')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Furnished Filter */}
        <Button 
          variant={filters.furnished ? "default" : "outline"} 
          size="sm" 
          className="w-full justify-start"
          onClick={() => onFiltersChange({ 
            ...filters, 
            furnished: filters.furnished ? undefined : true 
          })}
        >
          <Sofa className="h-4 w-4 mr-2" />
          {t('filters.furnished')}
        </Button>

        {/* Amenities Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.amenities && filters.amenities.length > 0 ? "default" : "outline"} 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                {getAmenitiesLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.amenities')}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commonAmenities.slice(0, 8).map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={amenity}
                      checked={filters.amenities?.includes(amenity) || false}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground w-full justify-start mt-2"
          >
            <X className="h-4 w-4 mr-2" />
            {t('filters.clearAll')}
          </Button>
        )}
      </div>

      {/* Desktop/Tablet: Horizontal compact layout */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {/* Price Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.priceMin || filters.priceMax ? "default" : "outline"} 
              size="sm" 
              className="whitespace-nowrap h-9 text-sm"
            >
              <Euro className="h-4 w-4 mr-1.5" />
              {getPriceLabel()}
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 z-[60] bg-background border shadow-lg">
            <div className="space-y-4">
              <Label className="text-sm font-medium">{t('filters.priceRange')}</Label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={2000}
                  min={300}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>€{priceRange[0]}</span>
                  <span>€{priceRange[1]}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Property Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.type && filters.type.length > 0 ? "default" : "outline"} 
              size="sm" 
              className="whitespace-nowrap h-9 text-sm"
            >
              <Home className="h-4 w-4 mr-1.5" />
              {getTypeLabel()}
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 z-[60] bg-background border shadow-lg">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.propertyType')}</Label>
              <div className="space-y-2">
                {listingTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`desktop-${type.value}`}
                      checked={filters.type?.includes(type.value) || false}
                      onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                    />
                    <Label htmlFor={`desktop-${type.value}`} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bedrooms Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.bedrooms ? "default" : "outline"} 
              size="sm" 
              className="whitespace-nowrap h-9 text-sm"
            >
              <Bed className="h-4 w-4 mr-1.5" />
              {getBedroomsLabel()}
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 z-[60] bg-background border shadow-lg">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.bedrooms')}</Label>
              <Select 
                value={filters.bedrooms?.toString() || 'any'} 
                onValueChange={(value) => onFiltersChange({ 
                  ...filters, 
                  bedrooms: value === 'any' ? undefined : parseInt(value) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.any')} />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-popover border shadow-lg">
                  <SelectItem value="any">{t('filters.any')}</SelectItem>
                  <SelectItem value="1">1 {t('filters.bedroom')}</SelectItem>
                  <SelectItem value="2">2 {t('filters.bedroomsPlural')}</SelectItem>
                  <SelectItem value="3">{t('filters.bedroomsPlus')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Furnished Filter - Toggle button */}
        <Button 
          variant={filters.furnished ? "default" : "outline"} 
          size="sm" 
          className="whitespace-nowrap h-9 text-sm"
          onClick={() => onFiltersChange({ 
            ...filters, 
            furnished: filters.furnished ? undefined : true 
          })}
        >
          <Sofa className="h-4 w-4 mr-1.5" />
          {t('filters.furnished')}
        </Button>

        {/* Amenities Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.amenities && filters.amenities.length > 0 ? "default" : "outline"} 
              size="sm" 
              className="whitespace-nowrap h-9 text-sm"
            >
              <Wifi className="h-4 w-4 mr-1.5" />
              {getAmenitiesLabel()}
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 z-[60] bg-background border shadow-lg">
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('filters.amenities')}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commonAmenities.slice(0, 8).map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`desktop-${amenity}`}
                      checked={filters.amenities?.includes(amenity) || false}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <Label htmlFor={`desktop-${amenity}`} className="text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground whitespace-nowrap h-9 text-sm"
          >
            <X className="h-4 w-4 mr-1.5" />
            {t('filters.clearAll')}
          </Button>
        )}
      </div>
    </div>
  );
}