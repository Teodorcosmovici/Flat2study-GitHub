import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Globe, Star, Calendar, Euro, Headphones, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import { ScrollLockedTextReveal } from '@/components/ui/scroll-locked-text-reveal';
export default function LandlordLanding() {
  const {
    t
  } = useLanguage();
  const features = [{
    icon: Star,
    title: t('landlord.features.qualityTenants'),
    description: t('landlord.features.qualityTenantsDesc'),
    highlight: true
  }, {
    icon: Calendar,
    title: t('landlord.features.onlineBookings'),
    description: t('landlord.features.onlineBookingsDesc'),
    highlight: false
  }, {
    icon: Euro,
    title: t('landlord.features.payOnSuccess'),
    description: t('landlord.features.payOnSuccessDesc'),
    highlight: true
  }, {
    icon: Headphones,
    title: t('landlord.features.personalService'),
    description: t('landlord.features.personalServiceDesc'),
    highlight: false
  }];
  const steps = [{
    number: "1",
    title: t('landlord.steps.step1.title'),
    description: t('landlord.steps.step1.desc'),
    bgColor: "bg-primary/10"
  }, {
    number: "2",
    title: t('landlord.steps.step2.title'),
    description: t('landlord.steps.step2.desc'),
    bgColor: "bg-accent/20"
  }, {
    number: "3",
    title: t('landlord.steps.step3.title'),
    description: t('landlord.steps.step3.desc'),
    bgColor: "bg-secondary/20"
  }];
  const stats = [{
    number: t('landlord.stats.students'),
    label: t('landlord.stats.studentsLabel'),
    sublabel: t('landlord.stats.studentsSubLabel')
  }, {
    number: t('landlord.stats.universities'),
    label: t('landlord.stats.universitiesLabel'),
    sublabel: t('landlord.stats.universitiesSubLabel')
  }, {
    number: t('landlord.stats.days'),
    label: t('landlord.stats.daysLabel'),
    sublabel: t('landlord.stats.daysSubLabel')
  }];
  return <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {t('landlord.hero.badge')}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('landlord.hero.title1')} 
                <span className="block">{t('landlord.hero.title2')}</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
                {t('landlord.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup/private">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-2xl font-bold px-12 py-8 animate-pulse hover:animate-none shadow-2xl">
                    {t('landlord.hero.listWithUs')}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10 text-lg px-8 py-6">
                    {t('landlord.hero.logIn')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => <div key={index} className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.number}
                </h3>
                <p className="text-lg font-medium text-foreground">
                  {stat.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            {t('landlord.cta.notUsual')}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            {t('landlord.cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            {t('landlord.cta.subtitle')}
          </p>
        </div>
      </section>

      {/* Features Scroll Animation */}
      <ScrollLockedTextReveal
        items={[
          t('landlord.features.qualityTenants'),
          t('landlord.features.onlineBookings'),
          t('landlord.features.payOnSuccess'),
          t('landlord.features.personalService')
        ]}
      />

      {/* Steps Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t('landlord.steps.title')}
            </h2>
          </div>
          
          <div className="space-y-8">
            {steps.map((step, index) => <div key={index} className={`${step.bgColor} rounded-2xl p-8`}>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>)}
            
            {/* Additional info for step 3 */}
            <div className="bg-background border rounded-2xl p-8">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You will receive complete information about your potential tenants. Once a request is accepted,  the tenant pays the first month rental and the deposit..</p>
                <p className="text-muted-foreground">
                  {t('landlord.steps.additionalInfo2')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            {t('landlord.finalCta.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">{t('landlord.finalCta.subtitle')}</p>
          <Link to="/signup/private">
            <Button size="lg" className="hero-gradient text-white text-2xl font-bold px-16 py-8 shadow-2xl">
              {t('landlord.finalCta.startListing')}
            </Button>
          </Link>
        </div>
      </section>
    </div>;
}