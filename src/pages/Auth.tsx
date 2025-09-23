import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Auth() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, resetPassword, user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Redirect authenticated users to homepage or checkout
  useEffect(() => {
    console.log('Auth page - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && user) {
      console.log('Redirecting authenticated user');
      // Check if there's a redirect URL in search params
      const redirectTo = searchParams.get('redirect');
      const checkin = searchParams.get('checkin');
      const checkout = searchParams.get('checkout');
      const persons = searchParams.get('persons');
      
      if (redirectTo && checkin && checkout && persons) {
        // Redirect to checkout with the booking parameters
        navigate(`${redirectTo}?checkin=${checkin}&checkout=${checkout}&persons=${persons}`, { replace: true });
      } else {
        // Navigate to home page
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate, searchParams]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t('auth.checkingAuth')}</span>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      setError(error.message || t('auth.loginFailed'));
      setLoading(false);
    } else {
      // Success! The useEffect above will handle navigation once user is set
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      setError(error.message || t('auth.resetFailed'));
    } else {
      setSuccess(t('auth.resetSuccess'));
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('auth.backToHome')}
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('auth.title')}</CardTitle>
            <CardDescription>
              {t('auth.description')}
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

            {!showForgotPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.logIn')}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">{t('auth.resetTitle')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('auth.resetDescription')}
                  </p>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('auth.email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sendResetEmail')}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                        setError(null);
                      }}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {t('auth.backToLogin')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link 
                  to={`/get-started${window.location.search}`} 
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.getStarted')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}