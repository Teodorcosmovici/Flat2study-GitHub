import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Users, Check, ChevronsUpDown } from 'lucide-react';
import { MILAN_UNIVERSITIES } from '@/data/universities';
import { countries, getPriorityCountries, getOtherCountries } from '@/data/countries';
import { Listing } from '@/types';
import { toast } from 'sonner';

const applicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  gender: z.enum(['male', 'female', 'other']),
  birthDay: z.string().min(1, 'Day is required'),
  birthMonth: z.string().min(1, 'Month is required'),
  birthYear: z.string().min(1, 'Year is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  university: z.string().min(1, 'University is required'),
  document: z.any().optional(),
  message: z.string().min(1, 'Message to landlord is required'),
});

interface RentalApplicationFormProps {
  listing: Listing;
  onSubmit: (data: any) => void;
}

const NATIONALITIES = [
  'Italian', 'American', 'French', 'German', 'Spanish', 'British', 'Chinese', 'Indian', 'Brazilian', 'Other'
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];
const YEARS = Array.from({ length: 50 }, (_, i) => (2024 - i).toString());

export function RentalApplicationForm({ listing, onSubmit }: RentalApplicationFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('+39');
  
const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      countryCode: '+39', // Default to Italy
      firstName: '',
      lastName: '',
      phone: '',
      gender: 'male',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      nationality: '',
      university: '',
      message: '',
    }
  });

  const allCountries = [...getPriorityCountries(), ...getOtherCountries()];
  const selectedCountryData = allCountries.find(c => c.dialCode === selectedCountry);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }
      
      setUploadedFile(file);
      form.setValue('document', file);
      toast.success('Document uploaded successfully');
    }
  };

  const handleSubmit = (data: any) => {
    // Add uploaded file to form data
    const formData = {
      ...data,
      document: uploadedFile,
      listingId: listing.id,
    };
    
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Tell us about yourself
        </CardTitle>
        <p className="text-muted-foreground">
          This way we and the owner can get to know you and get in touch with you. 
          We will contact you at this address.
        </p>
        
        {/* Fake stats to encourage applications */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-purple-700">
            <Users className="h-4 w-4" />
            <span className="font-medium text-sm">7 REQUESTS SENT FOR THIS PROPERTY!</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                placeholder="Enter your first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                placeholder="Enter your last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <Label>Telephone (with country code) *</Label>
            <div className="flex gap-2">
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-32 justify-between"
                  >
                    {selectedCountryData ? (
                      <span className="flex items-center gap-1">
                        {selectedCountryData.flag} {selectedCountryData.dialCode}
                      </span>
                    ) : (
                      "Select..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput placeholder="Search countries..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup heading="Popular Countries">
                        {getPriorityCountries().map((country) => (
                          <CommandItem
                            key={country.dialCode}
                            value={`${country.name} ${country.dialCode}`}
                            onSelect={() => {
                              setSelectedCountry(country.dialCode);
                              form.setValue('countryCode', country.dialCode);
                              setCountryOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedCountry === country.dialCode ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span className="flex items-center gap-2">
                              {country.flag} {country.name} ({country.dialCode})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Other Countries">
                        {getOtherCountries().map((country) => (
                          <CommandItem
                            key={country.dialCode}
                            value={`${country.name} ${country.dialCode}`}
                            onSelect={() => {
                              setSelectedCountry(country.dialCode);
                              form.setValue('countryCode', country.dialCode);
                              setCountryOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedCountry === country.dialCode ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span className="flex items-center gap-2">
                              {country.flag} {country.name} ({country.dialCode})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                {...form.register('phone')}
                placeholder="Your phone number"
                className="flex-1"
              />
            </div>
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <Label>Gender *</Label>
            <RadioGroup onValueChange={(value) => form.setValue('gender', value as 'male' | 'female' | 'other')}>
              <div className="flex gap-6 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </div>
            </RadioGroup>
            {form.formState.errors.gender && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.gender.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <Label>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Select onValueChange={(value) => form.setValue('birthDay', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => form.setValue('birthMonth', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => form.setValue('birthYear', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.formState.errors.birthDay || form.formState.errors.birthMonth || form.formState.errors.birthYear) && (
              <p className="text-sm text-destructive mt-1">
                Please complete your date of birth
              </p>
            )}
          </div>

          {/* Nationality */}
          <div>
            <Label htmlFor="nationality">Nationality *</Label>
            <Select onValueChange={(value) => form.setValue('nationality', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nationality) => (
                  <SelectItem key={nationality} value={nationality}>
                    {nationality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.nationality && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.nationality.message}
              </p>
            )}
          </div>

          {/* University */}
          <div>
            <Label htmlFor="university">University *</Label>
            <Select onValueChange={(value) => form.setValue('university', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent>
                {MILAN_UNIVERSITIES.map((uni) => (
                  <SelectItem key={uni.id} value={uni.name}>
                    {uni.name} ({uni.shortName})
                  </SelectItem>
                ))}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.university && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.university.message}
              </p>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <Label>University Enrollment Certificate or Job Offer Certificate</Label>
            <div className="mt-2">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  id="document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="document" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {uploadedFile ? uploadedFile.name : 'Click to upload document'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Message to Landlord */}
          <div>
            <Label htmlFor="message">Write a message to your landlord *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Landlords are more likely to accept your request if you share your reasons for moving, 
              your work or studies, and details about yourself and companions.
            </p>
            <Textarea
              id="message"
              {...form.register('message')}
              placeholder="Hi, I'm John! I'm moving to this city to start my studies in engineering at the university. I enjoy reading and..."
              rows={4}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-12 text-base">
            Next step
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}