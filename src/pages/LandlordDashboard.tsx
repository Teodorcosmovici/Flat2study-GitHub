import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Home, Calendar, BarChart3, Edit, Eye, Trash2, LogOut, User, CheckCircle, Search, Building2, MessageSquare, Clock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useListingText } from '@/hooks/useListingText';

interface Listing {
  id: string;
  title: string;
  title_multilingual?: any;
  type: string;
  city: string;
  rent_monthly_eur: number;
  status: string;
  review_status: string;
  images: string[];
  created_at: string;
  published_at: string;
  bedrooms: number;
  bathrooms: number;
  booking_requests_count?: number;
}

// Using BookingType from '@/types/booking' for confirmed bookings data


export const LandlordDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const { t } = useLanguage();
  const { getLocalizedText } = useListingText();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the dashboard stats hook for real-time updates
  const { activeListingsCount, uniqueInquiriesCount, loading: statsLoading } = useDashboardStats();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    // Only redirect if we have a profile and it's definitely not agency or private
    if (profile && !['private', 'agency'].includes(profile.user_type)) {
      navigate('/');
      return;
    }
    
    // Only fetch data if we have a profile
    if (profile) {
      fetchDashboardData();
    }

    // Set up real-time subscription for listings and bookings updates
    const channel = supabase
      .channel('landlord-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `agency_id=eq.${profile?.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `landlord_id=eq.${profile?.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, navigate]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch listings with booking request counts
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // For each listing, count booking requests
      const listingsWithCounts = await Promise.all(
        (listingsData || []).map(async (listing) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)
            .eq('payment_status', 'authorized');
          
          return {
            ...listing,
            images: Array.isArray(listing.images) ? listing.images.map(img => String(img)) : [],
            booking_requests_count: count || 0
          };
        })
      );

      setListings(listingsWithCounts);
      
      // Fetch booking requests via RPC with tenant and listing info (bypasses RLS safely)
      const { data: pendingData, error: pendingError } = await supabase.rpc('get_pending_bookings_with_tenant', {
        p_landlord_id: profile.id,
      });

      if (pendingError) {
        console.error('Error fetching booking requests:', pendingError);
        setBookingRequests([]);
      } else {
        // Format the RPC results to match our expected structure
        const formattedBookings = await Promise.all(
          (pendingData || []).map(async (booking) => {
            // Generate a signed URL for the application document if present
            let application_document_signed_url: string | null = null;
            if (booking.application_document_url) {
              try {
                const { data: signed, error: urlError } = await supabase.storage
                  .from('applications')
                  .createSignedUrl(booking.application_document_url, 60 * 60); // 1 hour
                if (urlError) {
                  console.error('Error creating signed URL (landlord dashboard):', urlError);
                } else {
                  application_document_signed_url = signed?.signedUrl || null;
                }
              } catch (err) {
                console.error('Error generating document URL (landlord dashboard):', err);
              }
            }
            
            return {
              ...booking,
              tenant: {
                full_name: booking.tenant_full_name,
                email: booking.tenant_email,
                phone: booking.tenant_phone,
                university: booking.tenant_university,
              },
              listing: {
                title: booking.listing_title,
                address_line: booking.listing_address_line,
                images: booking.listing_images,
              },
              application_document_signed_url,
            } as any;
          })
        );
        
        setBookingRequests(formattedBookings);
      }
      
      // Fetch confirmed bookings via RPC with tenant and listing info (bypasses RLS safely)
      const { data: confirmedData, error: confirmedError } = await supabase.rpc('get_confirmed_bookings_with_tenant', {
        p_landlord_id: profile.id,
      });

      if (confirmedError) {
        console.error('Error fetching confirmed bookings:', confirmedError);
        setBookings([]);
      } else {
        const confirmedBookingsEnriched = await Promise.all(
          (confirmedData || []).map(async (b: any) => {
            // Generate a signed URL for the application document if present
            let application_document_signed_url: string | null = null;
            if (b.application_document_url) {
              try {
                const { data: signed, error: urlError } = await supabase.storage
                  .from('applications')
                  .createSignedUrl(b.application_document_url, 60 * 60); // 1 hour
                if (!urlError) {
                  application_document_signed_url = signed?.signedUrl || null;
                } else {
                  console.error('Error creating signed URL (confirmed bookings):', urlError);
                }
              } catch (err) {
                console.error('Error generating document URL (confirmed bookings):', err);
              }
            }

            return {
              id: b.id,
              listing_id: b.listing_id,
              tenant_id: b.tenant_id,
              landlord_id: b.landlord_id,
              status: b.status,
              check_in_date: b.check_in_date,
              check_out_date: b.check_out_date,
              monthly_rent: b.monthly_rent,
              security_deposit: b.security_deposit,
              total_amount: b.total_amount,
              payment_authorization_id: b.payment_authorization_id,
              payment_status: b.payment_status,
              authorization_expires_at: b.authorization_expires_at,
              landlord_response_due_at: b.landlord_response_due_at,
              landlord_response: b.landlord_response,
              application_message: b.application_message,
              application_document_url: b.application_document_url,
              application_document_type: b.application_document_type,
              created_at: b.created_at,
              updated_at: b.updated_at,
              tenant: {
                full_name: b.tenant_full_name,
                email: b.tenant_email,
                phone: b.tenant_phone,
                university: b.tenant_university,
              },
              listing: {
                title: b.listing_title,
                address_line: b.listing_address_line,
                images: Array.isArray(b.listing_images) ? b.listing_images : [],
              },
              application_document_signed_url,
            } as any;
          })
        );

        setBookings(confirmedBookingsEnriched);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: t('dashboard.error'),
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingResponse = async (bookingId: string, response: 'accepted' | 'refused') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: response === 'accepted' ? 'confirmed' : 'cancelled',
          landlord_response: response === 'accepted' ? 'approved' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh the booking requests
      await fetchDashboardData();
      
      toast({
        title: t('dashboard.success'),
        description: response === 'accepted' ? t('dashboard.bookingApproved') : t('dashboard.bookingDeclined'),
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.bookingUpdateError'),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, reviewStatus: string) => {
    if (status === 'RENTED') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">{t('dashboard.rented')}</Badge>;
    }
    if (status === 'PUBLISHED') {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">{t('dashboard.published')}</Badge>;
    }
    if (reviewStatus === 'rejected') {
      return <Badge variant="destructive">{t('dashboard.rejected')}</Badge>;
    }
    // Default for DRAFT, pending_review, etc.
    return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">{t('dashboard.pending')}</Badge>;
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: t('dashboard.success'),
        description: t('dashboard.listingDeleted'),
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.deleteListingError'),
        variant: "destructive",
      });
    }
  };

  const handleRentedOut = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'RENTED' })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: t('dashboard.success'),
        description: t('dashboard.listingMarkedRented'),
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.updateListingError'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">{t('dashboard.loadingDashboard')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/create-listing')} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboard.addListing')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                {t('dashboard.backToHome')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('dashboard.logout')}
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="listings" className="w-full">
          <div className="border-b">
            <TabsList className="h-14 bg-transparent gap-8 px-0">
              <TabsTrigger 
                value="listings" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                {t('dashboard.listings')}
              </TabsTrigger>
              <TabsTrigger 
                value="booking-requests" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                {t('dashboard.bookingRequests')}
              </TabsTrigger>
              <TabsTrigger 
                value="confirmed-bookings" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                {t('dashboard.confirmedBookings')}
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 rounded-none font-medium"
              >
                {t('dashboard.account')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Listings Tab */}
          <TabsContent value="listings" className="py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold">{listings.length} {t('dashboard.listings')}</h2>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => navigate('/create-listing')} className="bg-primary hover:bg-primary/90 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.addAListing')}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder={t('dashboard.quickFind')}
                className="pl-10 bg-muted/30 border-muted"
              />
            </div>

            {/* Listings Table */}
            <div className="bg-card rounded-lg border">
              {/* Table Header */}
              <div className="grid grid-cols-10 gap-4 p-4 border-b bg-muted/20 rounded-t-lg font-medium text-sm text-muted-foreground">
                <div className="col-span-1">
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="col-span-3">{t('dashboard.addressReference')}</div>
                <div className="col-span-1">{t('dashboard.price')}</div>
                <div className="col-span-2">{t('dashboard.verification')}</div>
                <div className="col-span-2">{t('dashboard.tenantsInterested')}</div>
                <div className="col-span-1">{t('dashboard.actions')}</div>
              </div>

              {/* Table Content */}
              {listings.map((listing) => (
                <div key={listing.id} className="grid grid-cols-10 gap-4 p-4 border-b hover:bg-muted/5">
                  <div className="col-span-1">
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="col-span-3">
                    <div className="flex gap-3">
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{getLocalizedText(listing.title_multilingual, listing.title)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.ref')} {listing.id.slice(0, 8)} | {t('dashboard.bedroom')} {listing.bedrooms}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span className="font-medium">€{listing.rent_monthly_eur}</span>
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(listing.status, listing.review_status)}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{listing.booking_requests_count || 0}</span>
                      <span className="text-sm text-muted-foreground">{t('dashboard.requests')}</span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="hover:bg-muted"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          console.log('Edit button clicked for listing:', listing.id);
                          navigate(`/edit-listing/${listing.id}`);
                        }}
                        className="hover:bg-muted"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this listing? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteListing(listing.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}

              {listings.length === 0 && (
                <div className="p-12 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboard.noListingsEmpty')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('dashboard.createFirstListingDesc')}
                  </p>
                  <Button onClick={() => navigate('/create-listing')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.createYourFirstListing')}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Booking Requests Tab */}
          <TabsContent value="booking-requests" className="py-6">
            {bookingRequests.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.noBookingRequestsEmpty')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('dashboard.onceReceiveBookingRequests')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold">{bookingRequests.length} {t('dashboard.bookingRequestsCount')}</h2>
                </div>

                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Tenant Info */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.tenant?.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{request.tenant?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{t('dashboard.university')}:</span>
                              <span className="text-sm">{request.tenant?.university || t('dashboard.notSpecified')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{t('common.phone')}:</span>
                              <span className="text-sm">{request.tenant?.phone || t('dashboard.notProvided')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{t('dashboard.checkIn')}:</span>
                              <span className="text-sm">{new Date(request.check_in_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{t('dashboard.checkOut')}:</span>
                              <span className="text-sm">{new Date(request.check_out_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{t('dashboard.monthlyRent')}:</span>
                              <span className="text-sm font-semibold">€{request.monthly_rent}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Column - Listing Info & Application */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Property</h4>
                            <div className="flex gap-3">
                              {request.listing?.images?.[0] && (
                                <img
                                  src={request.listing.images[0]}
                                  alt={request.listing.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">{request.listing?.title}</p>
                                <p className="text-xs text-muted-foreground">{request.listing?.address_line}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">{t('dashboard.applicationMessage')}</h4>
                            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                              {request.application_message ? (
                                <p>{request.application_message}</p>
                              ) : (
                                <p className="text-muted-foreground italic">{t('dashboard.noMessageProvided')}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">{t('dashboard.supportingDocument')}</h4>
                            {request.application_document_signed_url ? (
                              <a 
                                href={request.application_document_signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                              >
                                {t('dashboard.viewDocument')} ({request.application_document_type || 'document'})
                              </a>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {t('dashboard.noDocumentUploaded')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column - Actions */}
                        <div className="space-y-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm text-muted-foreground">
                              {t('dashboard.requestReceived')}: {new Date(request.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t('dashboard.paymentAuthorizedUntil')}: {new Date(request.authorization_expires_at).toLocaleDateString()}
                            </div>
                          </div>

                          {request.status === 'pending_landlord_response' ? (
                            <div className="space-y-3">
                              <Button 
                                onClick={() => handleBookingResponse(request.id, 'accepted')}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {t('dashboard.acceptApplication')}
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                    {t('dashboard.refuseApplication')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('dashboard.refuseApplication')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('dashboard.refuseApplicationConfirm')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleBookingResponse(request.id, 'refused')}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {t('dashboard.refuseApplication')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Badge 
                                variant={request.status === 'confirmed' ? 'default' : 'destructive'}
                                className={request.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                >
                                {request.status === 'confirmed' ? t('dashboard.accepted') : t('dashboard.refused')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Confirmed Bookings Tab */}
          <TabsContent value="confirmed-bookings" className="py-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboard.confirmedBookings')}</h3>
              <p className="text-muted-foreground">No confirmed bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">{bookings.length} {t('dashboard.confirmedBookings')}</h2>
              </div>

              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <Card key={booking.id} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Tenant Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{booking.tenant?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{booking.tenant?.email}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{t('dashboard.university')}:</span>
                            <span className="text-sm">{booking.tenant?.university || t('dashboard.notSpecified')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{t('common.phone')}:</span>
                            <span className="text-sm">{booking.tenant?.phone || t('dashboard.notProvided')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{t('dashboard.checkIn')}:</span>
                            <span className="text-sm">{new Date(booking.check_in_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{t('dashboard.checkOut')}:</span>
                            <span className="text-sm">{new Date(booking.check_out_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{t('dashboard.monthlyRent')}:</span>
                            <span className="text-sm font-semibold">€{booking.monthly_rent}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Column - Listing Info & Application */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Property</h4>
                          <div className="flex gap-3">
                            {booking.listing?.images?.[0] && (
                              <img
                                src={booking.listing.images[0]}
                                alt={booking.listing.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{booking.listing?.title}</p>
                              <p className="text-xs text-muted-foreground">{booking.listing?.address_line}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">{t('dashboard.applicationMessage')}</h4>
                          <div className="bg-muted/30 p-3 rounded-lg text-sm">
                            {booking.application_message ? (
                              <p>{booking.application_message}</p>
                            ) : (
                              <p className="text-muted-foreground italic">{t('dashboard.noMessageProvided')}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">{t('dashboard.supportingDocument')}</h4>
                          {booking.application_document_signed_url ? (
                            <a 
                              href={booking.application_document_signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                            >
                              {t('dashboard.viewDocument')} ({booking.application_document_type || 'document'})
                            </a>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('dashboard.noDocumentUploaded')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Status & Details */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">
                            {t('dashboard.confirmed')}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {t('dashboard.confirmedOn')}: {new Date(booking.updated_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Booking Confirmed</span>
                          </div>
                          <p className="text-xs text-green-700">
                            The tenant's payment has been authorized and the booking is confirmed.
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit:</span>
                            <span className="font-medium">€{booking.security_deposit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-semibold">€{booking.total_amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="py-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">{t('dashboard.accountSettings')}</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.profileInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t('dashboard.fullName')}</label>
                      <Input value={profile?.full_name || ''} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('common.email')}</label>
                      <Input value={user?.email || ''} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('dashboard.userType')}</label>
                      <Input value={t('dashboard.privateLandlord')} readOnly className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.actions')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/')}
                        className="flex-1"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        {t('dashboard.backToHome')}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        className="flex-1"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('dashboard.logout')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};