import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const COUNTRIES = [
  { name: "United States", code: "US", dialCode: "+1" },
  { name: "United Kingdom", code: "GB", dialCode: "+44" },
  { name: "Canada", code: "CA", dialCode: "+1" },
  { name: "Australia", code: "AU", dialCode: "+61" },
  { name: "Germany", code: "DE", dialCode: "+49" },
  { name: "France", code: "FR", dialCode: "+33" },
  { name: "Italy", code: "IT", dialCode: "+39" },
  { name: "Spain", code: "ES", dialCode: "+34" },
  { name: "Netherlands", code: "NL", dialCode: "+31" },
  { name: "Belgium", code: "BE", dialCode: "+32" },
  { name: "Switzerland", code: "CH", dialCode: "+41" },
  { name: "Austria", code: "AT", dialCode: "+43" },
  { name: "Poland", code: "PL", dialCode: "+48" },
  { name: "Portugal", code: "PT", dialCode: "+351" },
  { name: "Greece", code: "GR", dialCode: "+30" },
  { name: "Sweden", code: "SE", dialCode: "+46" },
  { name: "Norway", code: "NO", dialCode: "+47" },
  { name: "Denmark", code: "DK", dialCode: "+45" },
  { name: "Finland", code: "FI", dialCode: "+358" },
  { name: "Ireland", code: "IE", dialCode: "+353" },
  { name: "Czech Republic", code: "CZ", dialCode: "+420" },
  { name: "Hungary", code: "HU", dialCode: "+36" },
  { name: "Romania", code: "RO", dialCode: "+40" },
  { name: "Bulgaria", code: "BG", dialCode: "+359" },
  { name: "Croatia", code: "HR", dialCode: "+385" },
  { name: "Slovenia", code: "SI", dialCode: "+386" },
  { name: "Slovakia", code: "SK", dialCode: "+421" },
  { name: "Lithuania", code: "LT", dialCode: "+370" },
  { name: "Latvia", code: "LV", dialCode: "+371" },
  { name: "Estonia", code: "EE", dialCode: "+372" },
  { name: "Luxembourg", code: "LU", dialCode: "+352" },
  { name: "Malta", code: "MT", dialCode: "+356" },
  { name: "Cyprus", code: "CY", dialCode: "+357" },
  { name: "Iceland", code: "IS", dialCode: "+354" },
  { name: "China", code: "CN", dialCode: "+86" },
  { name: "Japan", code: "JP", dialCode: "+81" },
  { name: "South Korea", code: "KR", dialCode: "+82" },
  { name: "India", code: "IN", dialCode: "+91" },
  { name: "Brazil", code: "BR", dialCode: "+55" },
  { name: "Mexico", code: "MX", dialCode: "+52" },
  { name: "Argentina", code: "AR", dialCode: "+54" },
  { name: "Chile", code: "CL", dialCode: "+56" },
  { name: "Colombia", code: "CO", dialCode: "+57" },
  { name: "Peru", code: "PE", dialCode: "+51" },
  { name: "Venezuela", code: "VE", dialCode: "+58" },
  { name: "South Africa", code: "ZA", dialCode: "+27" },
  { name: "Egypt", code: "EG", dialCode: "+20" },
  { name: "Nigeria", code: "NG", dialCode: "+234" },
  { name: "Kenya", code: "KE", dialCode: "+254" },
  { name: "Morocco", code: "MA", dialCode: "+212" },
  { name: "Algeria", code: "DZ", dialCode: "+213" },
  { name: "Tunisia", code: "TN", dialCode: "+216" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
  { name: "Israel", code: "IL", dialCode: "+972" },
  { name: "Turkey", code: "TR", dialCode: "+90" },
  { name: "Russia", code: "RU", dialCode: "+7" },
  { name: "Ukraine", code: "UA", dialCode: "+380" },
  { name: "Thailand", code: "TH", dialCode: "+66" },
  { name: "Singapore", code: "SG", dialCode: "+65" },
  { name: "Malaysia", code: "MY", dialCode: "+60" },
  { name: "Indonesia", code: "ID", dialCode: "+62" },
  { name: "Philippines", code: "PH", dialCode: "+63" },
  { name: "Vietnam", code: "VN", dialCode: "+84" },
  { name: "New Zealand", code: "NZ", dialCode: "+64" },
  { name: "Pakistan", code: "PK", dialCode: "+92" },
  { name: "Bangladesh", code: "BD", dialCode: "+880" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94" },
].sort((a, b) => a.name.localeCompare(b.name));

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  required?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "IT",
  placeholder = "Phone number",
  required = false,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState(
    COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setOpen(false);
    // Update phone value with new country code if there's a number
    const phoneNumber = value.replace(/^\+\d+\s*/, "");
    if (phoneNumber) {
      onChange(`${country.dialCode} ${phoneNumber}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    // Remove any existing country code from the input
    const cleanNumber = phoneNumber.replace(/^\+\d+\s*/, "");
    onChange(`${selectedCountry.dialCode} ${cleanNumber}`);
  };

  // Extract phone number without country code for display
  const displayValue = value.replace(/^\+\d+\s*/, "");

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[140px] justify-between"
          >
            <span className="truncate">
              {selectedCountry.dialCode} {selectedCountry.code}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-background" align="start">
          <Command>
            <CommandInput placeholder="Search country..." className="h-9" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode}`}
                    onSelect={() => handleCountrySelect(country)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCountry.code === country.code
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{country.name}</span>
                    <span className="text-muted-foreground">{country.dialCode}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={displayValue}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        className="flex-1"
      />
    </div>
  );
}
