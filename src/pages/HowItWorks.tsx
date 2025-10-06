import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, MessageSquare, Clock, Key, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Search,
      title: t('howItWorks.step1.title') || "Make a booking request",
      description: t('howItWorks.step1.description') || "With just a few simple details you can make a request for the property. Remember, we won't charge you until the Landlord confirms.",
    },
    {
      icon: Clock,
      title: t('howItWorks.step2.title') || "Get an answer in 24h or less",
      description: t('howItWorks.step2.description') || "The Landlord has 24 hours to respond to your booking request. If they accept, your payment method will be charged and we will put you in contact with the Landlord. If they don't accept, no worries, you won't be charged and we'll help you find alternatives.",
    },
    {
      icon: Key,
      title: t('howItWorks.step3.title') || "Move in",
      description: t('howItWorks.step3.description') || "Arrange your move-in date, key collection and anything else directly with your Landlord. As an extra security step, we will only transfer the first month's rent to the Landlord 24 hours after you move in, unless you contact us with a problem.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.backToHome') || 'Back to Home'}
          </Button>
        </Link>

        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              {t('howItWorks.title') || 'How to Book'}
            </h1>
            <h2 className="text-2xl font-semibold text-primary">
              {t('howItWorks.subtitle') || 'Find your home 100% online'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.intro') || "With our platform, in-person visits are a thing of the past. Our team verifies the property to offer video tours and photos so you can view them online. We collect all the information you need to make your decision."}
            </p>
          </div>

          {/* Steps Section */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex gap-6 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {t('howItWorks.step') || 'Step'} {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('howItWorks.reminder.title') || 'Remember: you have 24h to check your new home'}
                </h3>
                <p className="text-muted-foreground">
                  {t('howItWorks.reminder.description') || "If the property is significantly different to what our listing promised, let us know within 24h since you move in, so we can help you."}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4 pt-8">
            <h3 className="text-2xl font-semibold text-foreground">
              {t('howItWorks.cta.title') || 'Ready to find your home?'}
            </h3>
            <Link to="/search">
              <Button size="lg" className="text-lg px-8">
                {t('howItWorks.cta.button') || 'Start Searching'}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
