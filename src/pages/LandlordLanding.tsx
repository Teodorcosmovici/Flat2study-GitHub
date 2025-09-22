import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Globe, Star, Calendar, Euro, Headphones, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LandlordLanding() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: "Guaranteed monthly payments",
      description: "Get your rent on time every month with our secure payment system and tenant verification process.",
      highlight: true
    },
    {
      icon: Globe,
      title: "Worldwide visibility",
      description: "Reach thousands of international students looking for quality accommodation across Europe and beyond.",
      highlight: false
    },
    {
      icon: Star,
      title: "Quality tenants",
      description: "Access verified student tenants with guaranteed first payments. You always choose whether to accept or not.",
      highlight: true
    },
    {
      icon: Calendar,
      title: "Online viewings and bookings",
      description: "Save time with virtual tours and direct online bookings. No more endless property showings.",
      highlight: false
    },
    {
      icon: Euro,
      title: "We only charge you if you rent out",
      description: "Pay only when successful - a small percentage of the total contract value once rented, never before.",
      highlight: true
    },
    {
      icon: Headphones,
      title: "Personalised service",
      description: "Get expert support from our multilingual team at your disposal to help you at all times.",
      highlight: false
    }
  ];

  const steps = [
    {
      number: "1",
      title: "List your property for free",
      description: "Create your listing with photos and details. No upfront costs.",
      bgColor: "bg-primary/10"
    },
    {
      number: "2", 
      title: "Accept booking requests",
      description: "Review verified student applications and choose your ideal tenant.",
      bgColor: "bg-accent/20"
    },
    {
      number: "3",
      title: "Receive payments",
      description: "Get secure monthly rent payments directly to your account.",
      bgColor: "bg-secondary/20"
    }
  ];

  const stats = [
    { number: "50,000", label: "students in our network", sublabel: "looking for an apartment per year" },
    { number: "5", label: "biggest universities in Milan", sublabel: "in our network" },
    { number: "7 days", label: "is enough for our best listings", sublabel: "to be rented" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Back Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  FLAT2STUDY LANDLORDS
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Maximize your profitability with our 
                <span className="block">medium-term renting</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
                Your property always booked, secured and generating constant income with verified international students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup/private">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-2xl font-bold px-12 py-8 animate-pulse hover:animate-none shadow-2xl">
                    List with us
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10 text-lg px-8 py-6">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Property Listed</h3>
                        <p className="text-white/70 text-sm">Your listing is now live</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Student Applications</h3>
                        <p className="text-white/70 text-sm">3 verified applications received</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Euro className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Monthly Income</h3>
                        <p className="text-white/70 text-sm">€1,200 guaranteed payment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.number}
                </h3>
                <p className="text-lg font-medium text-foreground">
                  {stat.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            NOT YOUR USUAL REAL ESTATE AD
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Everything you need to maximise your earnings
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            High ad visibility. Qualified tenants. Stress-free renting.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`h-full ${feature.highlight ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    feature.highlight ? 'bg-primary/10' : 'bg-muted/50'
                  }`}>
                    <feature.icon className={`w-8 h-8 ${feature.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Three simple steps
            </h2>
          </div>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className={`${step.bgColor} rounded-2xl p-8`}>
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
              </div>
            ))}
            
            {/* Additional info for step 3 */}
            <div className="bg-background border rounded-2xl p-8">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  You will receive complete information about your potential tenants. 
                  Once a request is accepted, we put you directly in touch with your tenant 
                  so you can organize their arrival.
                </p>
                <p className="text-muted-foreground">
                  Within 48 hours of your tenant's arrival, we will transfer you the 
                  first rental payment minus our service fee.
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
            Ready to start earning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of landlords already maximizing their rental income with verified student tenants.
          </p>
          <Link to="/signup/private">
            <Button size="lg" className="hero-gradient text-white text-2xl font-bold px-16 py-8 shadow-2xl">
              Start listing for free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}