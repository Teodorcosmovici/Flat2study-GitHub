import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Upload, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function SignupPrivate() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

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

    const fullName = `${name} ${surname}`;
    const additionalData = {
      user_type: 'private',
      phone,
      birth_date: birthDate,
      codice_fiscale: codiceFiscale,
      profile_picture: profilePicture ? profilePicture.name : null
    };

    const { error } = await signUp(email, password, 'private', fullName, additionalData);
    
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
            <CardTitle className="text-2xl font-bold">Landlord and Property Manager Registration</CardTitle>
            <CardDescription>
              {t('signup.private.description')}
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
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>{t('signup.student.profilePicture')}</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <Label htmlFor="profile-picture" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('signup.student.uploadPhoto')}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

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
                <Label htmlFor="phone">{t('signup.student.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('signup.student.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
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
                <Label htmlFor="birth-date">{t('signup.private.birthDate')}</Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codice-fiscale">{t('signup.private.codiceFiscale')}</Label>
                <Input
                  id="codice-fiscale"
                  type="text"
                  placeholder={t('signup.private.codiceFiscalePlaceholder')}
                  value={codiceFiscale}
                  onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                  maxLength={16}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('signup.private.createAccount')}
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