import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { countries, getPriorityCountries, getOtherCountries } from '@/data/countries';

export default function SignupStudent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+39');
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Use to continue');
      setLoading(false);
      return;
    }

    if (!acceptedPrivacy) {
      setError('You must accept the Privacy Policy to continue');
      setLoading(false);
      return;
    }

    const fullName = `${name} ${surname}`;
    const fullPhoneNumber = `${countryCode}${phone}`;
    const additionalData = {
      user_type: 'student',
      phone: fullPhoneNumber
    };

    const { error } = await signUp(email, password, 'student', fullName, additionalData);
    
    if (error) {
      if (error.message?.includes('already registered')) {
        setError(t('auth.accountExists'));
      } else {
        setError(error.message || t('auth.createFailed'));
      }
      setLoading(false);
    } else {
      // Check if there's a redirect URL in search params
      const redirectTo = searchParams.get('redirect');
      const checkin = searchParams.get('checkin');
      const checkout = searchParams.get('checkout');
      const persons = searchParams.get('persons');
      
      if (redirectTo && checkin && checkout && persons) {
        // Redirect to checkout with the booking parameters
        navigate(`${redirectTo}?checkin=${checkin}&checkout=${checkout}&persons=${persons}`);
      } else {
        // Navigate to home page
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/get-started')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('signup.student.backToSelection')}
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('signup.student.title')}</CardTitle>
            <CardDescription>
              {t('signup.student.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-destructive">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-500">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('signup.student.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('signup.student.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surname">{t('signup.student.surname')}</Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder={t('signup.student.surnamePlaceholder')}
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('signup.student.phone')} *</Label>
                <div className="flex space-x-2">
                  <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryCodeOpen}
                        className="w-32 justify-between"
                      >
                        {countryCode || "Select..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup heading="Priority Countries">
                            {getPriorityCountries().map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.dialCode} ${country.name}`}
                                onSelect={() => {
                                  setCountryCode(country.dialCode);
                                  setCountryCodeOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    countryCode === country.dialCode ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {country.flag} {country.dialCode} {country.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup heading="All Countries">
                            {getOtherCountries().map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.dialCode} ${country.name}`}
                                onSelect={() => {
                                  setCountryCode(country.dialCode);
                                  setCountryCodeOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    countryCode === country.dialCode ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {country.flag} {country.dialCode} {country.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="123 456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('signup.student.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('signup.student.passwordCreate')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('signup.student.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('signup.student.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Terms and Privacy acceptance */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <Label htmlFor="terms" className="cursor-pointer">
                      I accept the{' '}
                      <a 
                        href="/TERMS_OF_USE.docx" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Terms of Use
                      </a>
                      {' '}*
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <Label htmlFor="privacy" className="cursor-pointer">
                      I accept the{' '}
                      <a 
                        href="/Privacy_Notice.docx" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </a>
                      {' '}*
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !acceptedTerms || !acceptedPrivacy}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('signup.student.createAccount')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('signup.student.alreadyHaveAccount')}{' '}
                <Link to={`/auth${window.location.search}`} className="text-primary hover:underline">
                  {t('signup.student.logInHere')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}