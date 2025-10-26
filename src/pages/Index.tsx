import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, Shield, MapPin, Heart, MessageCircle, BarChart3, Plus, Eye, ChevronDown, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollIndicator } from '@/components/ui/scroll-indicator';
import { universities } from '@/data/mockData';
import { MILAN_UNIVERSITIES } from '@/data/universities';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { LanguageSelector } from '@/components/ui/language-selector';
import OwnerAccess from '@/components/OwnerAccess';
import OwnerDashboard from '@/pages/OwnerDashboard';
import React, { useState, useEffect, useRef } from 'react';
import bocconiImg from '@/assets/university-bocconi.png';
import cattolicaImg from '@/assets/university-cattolica.png';
import stataleImg from '@/assets/university-statale.png';
import politecnicoImg from '@/assets/university-politecnico.png';
import { FeaturedListingCard } from '@/components/listings/FeaturedListingCard';
import { Star, ExternalLink, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DraggableScrollContainer } from '@/components/ui/draggable-scroll-container';
const Index = () => {
  const {
    user,
    profile
  } = useAuth();
  const {
    t,
    language,
    setLanguage
  } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const unreadCount = 0; // Removed messaging system
  const {
    activeListingsCount,
    uniqueInquiriesCount,
    loading: statsLoading
  } = useDashboardStats();
  const {
    listings: featuredListings,
    loading: listingsLoading
  } = useFeaturedListings(6);
  const isMobile = useIsMobile();
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(() => {
    return sessionStorage.getItem('isOwnerAuthenticated') === 'true';
  });
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };
  const isStudent = profile?.user_type === 'student';
  const isLandlord = profile?.user_type === 'private';
  const isAdmin = profile?.user_type === 'admin';

  // Removed automatic redirect - users can now access homepage when logged in

  if (isOwnerAuthenticated) {
    return <OwnerDashboard />;
  }
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Full viewport height */}
      <section className="relative h-screen flex items-center justify-center hero-gradient text-white overflow-hidden">
        <div className="container mx-auto text-center relative z-10 px-4">
          {/* Mobile Language Selector - Only on homepage and mobile */}
          {isMobile && <div className="mb-6 flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center gap-1 border border-white/20">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${language === 'en' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}>
                  EN
                </button>
                <button onClick={() => setLanguage('it')} className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${language === 'it' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}>
                  IT
                </button>
              </div>
            </div>}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {user && profile ? `${t('home.heroWelcome')}, ${profile.full_name || 'User'}!` : t('home.heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            {user && profile ? isStudent ? t('home.heroSubtitleStudent') : t('home.heroSubtitleRealtor') : t('home.heroSubtitle')}
          </p>
          
          <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
            {user && isLandlord ? <>
                <Link to="/create-listing">
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-semibold">
                    <Plus className="mr-2 h-5 w-5" />
                    {t('addYourListings')}
                  </Button>
                </Link>
                <div className="text-center">
                  <Link to="/landlord-dashboard">
                    <span className="text-white/90 hover:text-white underline cursor-pointer text-lg">
                      {t('home.goToMyListings')}
                    </span>
                  </Link>
                </div>
              </> : <>
                <Link to="/search">
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-semibold">
                    <Search className="mr-2 h-5 w-5" />
                    {t('home.findPlace')}
                  </Button>
                </Link>
                <Link to="/landlord" className="mt-4 block">
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="w-full text-white hover:bg-white/10 hover:text-white border-0"
                  >
                    {t('header.landlord')}
                  </Button>
                </Link>
              </>}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-white/15"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 rounded-full bg-white/25"></div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 w-full">
          <ScrollIndicator />
        </div>
      </section>

      {/* Conditional Content Based on User Type */}
      {user && profile ? <>
          {isStudent ? <>
              {/* Universities Section for Students */}
              <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">{t('home.universitiesTitle')}</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      {t('home.universitiesSubtitle')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {MILAN_UNIVERSITIES.map((university) => {
                      const imageMap: Record<string, string> = {
                        'bocconi': bocconiImg,
                        'cattolica': cattolicaImg,
                        'statale': stataleImg,
                        'politecnico': politecnicoImg
                      };
                      
                      return (
                        <Link key={university.id} to={`/search?location=Milan`}>
                          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-64 relative group">
                            <div className="absolute inset-0">
                              <img 
                                src={imageMap[university.id]} 
                                alt={university.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                            </div>
                        <div className="absolute inset-0 flex flex-col justify-end pb-16 px-8 text-left">
                          <h3 className="text-white text-2xl font-bold drop-shadow-lg">
                            {university.name}
                          </h3>
                          {university.id === 'politecnico' && (
                            <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">di Milano</h3>
                          )}
                          <p className={`text-white text-base font-light drop-shadow-lg ${university.id !== 'politecnico' ? 'mb-2' : ''}`}>
                            Milan, Italy
                          </p>
                        </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Featured Listings for Students */}
              <section className="py-16 px-4">
                <div className="container mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">{t('home.featuredTitle')}</h2>
                    <p className="text-muted-foreground text-lg">
                      {t('home.featuredSubtitle')}
                    </p>
                  </div>
                  
                  <div className="relative mb-8">
                    {listingsLoading ? <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(6)].map((_, index) => <Card key={index} className="min-w-[220px] w-[220px] flex-shrink-0 overflow-hidden">
                            <div className="h-32 bg-muted animate-pulse"></div>
                            <CardContent className="p-4">
                              <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                              <div className="h-3 bg-muted animate-pulse rounded mb-3 w-3/4"></div>
                              <div className="flex items-center justify-between">
                                <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                                <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div> : featuredListings.length === 0 ? <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">{t('home.noListingsAvailable')}</p>
                        <p className="text-muted-foreground text-sm mt-2">{t('home.checkBackLater')}</p>
                      </div> : <DraggableScrollContainer className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                        {featuredListings.map(listing => (
                          <div key={listing.id} className="min-w-[400px] w-[400px] flex-shrink-0">
                            <FeaturedListingCard 
                              listing={listing}
                              formatPrice={formatPrice}
                              viewDetailsText={t('home.viewDetails')}
                            />
                          </div>
                        ))}
                      </DraggableScrollContainer>}
                  </div>
                  
                  <div className="text-center">
                    <Link to="/search">
                      <Button size="lg" variant="outline">
                        {t('home.viewAll')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>

              {/* Quick Actions for Students */}
              <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">{t('home.quickActions')}</h2>
                    <p className="text-muted-foreground text-lg">
                      {t('home.quickActionsSubtitle')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/my-bookings">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center relative">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <BarChart3 className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">My Bookings</h3>
                          <p className="text-muted-foreground">
                            View and manage your booking requests
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/favorites">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <Heart className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">{t('home.savedListings')}</h3>
                          <p className="text-muted-foreground">
                            {t('home.savedListingsDesc')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/search">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <Search className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">{t('home.explore')}</h3>
                          <p className="text-muted-foreground">
                            {t('home.exploreDesc')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Card className="h-full">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('home.recentActivity')}</h3>
                        <p className="text-muted-foreground text-sm">
                          {t('home.recentActivityDesc')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Scroll Indicator for Student Section */}
                <div className="flex justify-center py-8">
                  <ScrollIndicator className="text-muted-foreground" />
                </div>
              </section>
            </> : isLandlord ? <>
              {/* Realtor Dashboard Content */}
              <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">{t('home.quickActions')}</h2>
                    <p className="text-muted-foreground text-lg">
                      {t('home.quickActionsRealtorSubtitle')}
                    </p>
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link to="/create-listing">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <Plus className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">{t('home.addListing')}</h3>
                          <p className="text-muted-foreground">
                            {t('home.addListingDesc')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/landlord-dashboard">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <Eye className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">{t('home.myListings')}</h3>
                          <p className="text-muted-foreground">
                            {t('home.myListingsDesc')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/messages">
                      <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-6 text-center relative">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <MessageCircle className="h-8 w-8 text-primary" />
                          </div>
                          {unreadCount > 0 && <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                              {unreadCount}
                            </Badge>}
                          <h3 className="text-xl font-semibold mb-3">{t('home.messages')}</h3>
                          <p className="text-muted-foreground">
                            {t('home.messagesDescRealtor')}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>

                  </div>
                </div>
              </section>

            </> : null}
        </> : <>
          {/* Universities Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{t('home.universitiesTitle')}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  {t('home.universitiesSubtitle')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MILAN_UNIVERSITIES.map((university) => {
                  const imageMap: Record<string, string> = {
                    'bocconi': bocconiImg,
                    'cattolica': cattolicaImg,
                    'statale': stataleImg,
                    'politecnico': politecnicoImg
                  };
                  
                  return (
                    <Link key={university.id} to={`/search?location=Milan`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-64 relative group">
                        <div className="absolute inset-0">
                          <img 
                            src={imageMap[university.id]} 
                            alt={university.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-end pb-16 px-8 text-left">
                          <h3 className="text-white text-2xl font-bold drop-shadow-lg">
                            {university.name}
                          </h3>
                          {university.id === 'politecnico' && (
                            <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">di Milano</h3>
                          )}
                          <p className={`text-white text-base font-light drop-shadow-lg ${university.id !== 'politecnico' ? 'mb-2' : ''}`}>
                            Milan, Italy
                          </p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Featured Listings */}
          <section className="py-16 px-4">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{t('home.featuredTitle')}</h2>
                <p className="text-muted-foreground text-lg">
                  {t('home.featuredSubtitle')}
                </p>
              </div>
              
              <div className="relative mb-8">
                {listingsLoading ? <div className="flex gap-8 overflow-x-auto pb-4">
                    {[...Array(6)].map((_, index) => <Card key={index} className="min-w-[280px] max-w-[280px] flex-shrink-0 overflow-hidden">
                        <div className="h-72 bg-muted animate-pulse"></div>
                        <CardContent className="p-4">
                          <div className="h-3 bg-muted animate-pulse rounded mb-1"></div>
                          <div className="h-2 bg-muted animate-pulse rounded mb-2 w-3/4"></div>
                          <div className="flex items-center justify-between">
                            <div className="h-5 bg-muted animate-pulse rounded w-16"></div>
                            <div className="h-6 bg-muted animate-pulse rounded w-12"></div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div> : featuredListings.length === 0 ? <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">{t('home.noListingsAvailable')}</p>
                    <p className="text-muted-foreground text-sm mt-2">{t('home.checkBackLater')}</p>
                  </div> : <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {featuredListings.map(listing => (
                      <div key={listing.id} className="min-w-[400px] w-[400px] flex-shrink-0">
                        <FeaturedListingCard 
                          listing={listing}
                          formatPrice={formatPrice}
                          viewDetailsText={t('home.viewDetails')}
                        />
                      </div>
                    ))}
                  </div>}
              </div>
              
              <div className="text-center">
                <Link to="/search">
                  <Button size="lg" variant="outline">
                    {t('home.viewAll')}
                  </Button>
                </Link>
              </div>
            </div>
          </section>

      {/* Customer Reviews Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{language === 'it' ? 'Cosa Dicono i Nostri Clienti' : 'What Our Customers Say'}</h2>
            <p className="text-muted-foreground text-lg">
              {language === 'it' ? 'Recensioni verificate da Trustpilot' : 'Verified reviews from Trustpilot'}
            </p>
          </div>
          
          {/* Swipeable Reviews Carousel */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {/* Elodie's Review */}
              <div className="min-w-[350px] w-[350px] flex-shrink-0 snap-start">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold">E</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Elodie</h3>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-5 h-5 fill-green-500 text-green-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">sito incredibile</h4>
                    <p className="text-muted-foreground">
                      Ho trovato un appartamento meraviglioso grazie a questo sito, lo raccomando 100%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Marie's Review */}
              <div className="min-w-[350px] w-[350px] flex-shrink-0 snap-start">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold">MA</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Marie</h3>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-5 h-5 fill-green-500 text-green-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">Very great</h4>
                    <p className="text-muted-foreground">
                      Very great, I took a room for my son who is studying at Cattolica. Unfortunately I wasn't able to visit the place but it was exactly as described
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* View More Reviews Card */}
              <div className="min-w-[350px] w-[350px] flex-shrink-0 snap-start">
                <a 
                  href="https://ie.trustpilot.com/review/flat2study.com?languages=all" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-all bg-muted/30 hover:bg-muted/50">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                      <ExternalLink className="w-12 h-12 text-primary mb-4" />
                      <h3 className="text-xl font-semibold mb-2">
                        {language === 'it' ? 'Vedi altre recensioni' : 'View More Reviews'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {language === 'it' ? 'Leggi tutte le nostre recensioni su Trustpilot' : 'Read all our reviews on Trustpilot'}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(star => (
                            <Star key={star} className="w-5 h-5 fill-green-500 text-green-500" />
                          ))}
                          <Star className="w-5 h-5 fill-green-500/50 text-green-500" />
                        </div>
                        <span className="font-semibold">4.0</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </div>
          </div>

          {/* Trustpilot Banner */}
          <div className="border-t pt-8">
            <a 
              href="https://ie.trustpilot.com/review/flat2study.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{language === 'it' ? 'Molto buono' : 'Very good'}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(star => (
                    <Star key={star} className="w-6 h-6 fill-green-500 text-green-500" />
                  ))}
                  <Star className="w-6 h-6 fill-green-500/50 text-green-500" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="font-semibold">4.0 {language === 'it' ? 'su' : 'out of'} 5</div>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-1">
                  <Star className="w-5 h-5 fill-green-500 text-green-500" />
                  <span className="text-sm text-muted-foreground">Trustpilot</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

          {/* Benefits Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{t('home.whyChooseTitle')}</h2>
                <p className="text-muted-foreground text-lg">
                  {t('home.whyChooseSubtitle')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center">
                  <CardContent className="p-8">
                    <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{t('home.verifiedProperties')}</h3>
                    <p className="text-muted-foreground">
                      {t('home.verifiedPropertiesDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-8">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{t('home.studentOnly')}</h3>
                    <p className="text-muted-foreground">
                      {t('home.studentOnlyDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-8">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{t('home.perfectLocations')}</h3>
                    <p className="text-muted-foreground">
                      {t('home.perfectLocationsDesc')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Scroll Indicator for General Section */}
            <div className="flex justify-center py-8">
              <ScrollIndicator className="text-muted-foreground" />
            </div>
          </section>
        </>}

      {/* Admin Quick Access */}
      
      
      {/* Discrete Owner Access at the bottom of homepage */}
      <footer className="py-8 text-center bg-muted/20">
        <div className="container mx-auto">
          <OwnerAccess onAuthenticated={() => setIsOwnerAuthenticated(true)} />
          
          {/* Direct link for testing */}
          <div className="mt-4 pt-4 border-t border-muted">
            <Link to="/customer-database" className="text-sm text-muted-foreground hover:text-foreground">
              Customer Database (Test Link)
            </Link>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;